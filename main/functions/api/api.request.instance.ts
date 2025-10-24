'use strict';

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { createHTTP2Adapter } from 'axios-http2-adapter';
import * as https from 'node:https';
import * as path from 'node:path';
import * as fs from 'node:fs';
import http2 from 'http2-wrapper';
import { app } from 'electron';
import CacheableLookup from 'cacheable-lookup';

import { ConfigRepository } from '../../repositories/config';

/* =========================
   Konfigurasi & Singletons
   ========================= */
const CFG_KEY_BASE_URL = 'api.base_url';
const DEFAULT_BASE_URL = 'https://192.168.1.253:8083';

let repo: ConfigRepository | null = null;
let apiInstance: AxiosInstance | null = null;
let initPromise: Promise<void> | null = null;

/* =========================
   Path Sertifikat (mTLS)
   ========================= */
const getCaFilePath = () => path.join(app.getAppPath(), 'resources', 'cert', 'ca', 'certificate.crt');
const getClientDir = () =>
    app.isPackaged ? path.join(process.resourcesPath, 'cert', 'client') : path.join(process.cwd(), 'resources', 'cert', 'client');

/* =========================
   Dedupe TANPA cache (in-flight only)
   ========================= */
type AdapterFn = (cfg: InternalAxiosRequestConfig) => Promise<any>;
const makeDedupeAdapter = (baseAdapter: AdapterFn, opts?: {
    key?: (c: InternalAxiosRequestConfig) => string;
    methods?: Array<InternalAxiosRequestConfig['method']>;
    cooldownMs?: number; // default 0 (murni in-flight)
}) => {
    const inflight = new Map<string, Promise<any>>();
    const lastDoneAt = new Map<string, number>();
    const methods = (opts?.methods ?? ['get']).map((m) => (m || 'get').toLowerCase());
    const keyOf = opts?.key ?? ((c) =>
        `${(c.method || 'get').toLowerCase()}:${c.baseURL || ''}${c.url}` +
        `:${JSON.stringify(c.params || {})}:${JSON.stringify(c.data || {})}`);
    const cooldown = Math.max(0, opts?.cooldownMs ?? 0);

    return (cfg: InternalAxiosRequestConfig) => {
        if ((cfg as any).skipDedupe) return baseAdapter(cfg);
        const m = (cfg.method || 'get').toLowerCase();
        if (!methods.includes(m)) return baseAdapter(cfg);

        const k = keyOf(cfg);
        const doneAt = lastDoneAt.get(k) || 0;
        if (cooldown && Date.now() - doneAt < cooldown) return inflight.get(k) || baseAdapter(cfg);

        const p = inflight.get(k) || baseAdapter(cfg).finally(() => {
            inflight.delete(k);
            lastDoneAt.set(k, Date.now());
        });
        inflight.set(k, p);
        return p;
    };
};

/* =========================
   Init: Repo + Axios (HTTP/2 + mTLS)
   ========================= */
async function ensureInited() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (!app.isReady()) await app.whenReady();

        // Repo config + seed baseURL
        repo = new ConfigRepository();
        await repo.init({ [CFG_KEY_BASE_URL]: DEFAULT_BASE_URL });
        const baseURL = (await repo.get(CFG_KEY_BASE_URL)) || DEFAULT_BASE_URL;

        // Sertifikat sebagai Buffer (TLS friendly)
        const CA_FILE = getCaFilePath();
        const CLIENT_DIR = getClientDir();
        const ca = fs.readFileSync(CA_FILE);
        const cert = fs.readFileSync(path.join(CLIENT_DIR, 'certificate.crt'));
        const key = fs.readFileSync(path.join(CLIENT_DIR, 'private.key'));

        // DNS cache untuk H1 & H2
        const dns = new CacheableLookup({ maxTtl: 60, errorTtl: 0 });

        // Agent HTTP/1.1 (fallback)
        const httpsAgent = new https.Agent({
            ca: [ca],
            cert,
            key,
            rejectUnauthorized: true,
            requestCert: true,
            keepAlive: true,
            maxSockets: 256,
            maxFreeSockets: 64,
            keepAliveMsecs: 30_000,
            // Jika akses via IP tapi sertifikat pakai hostname, bisa set SNI:
            // servername: 'host.sesuai.cert',
        });
        dns.install(httpsAgent);

        // Agent HTTP/2 (utama)
        const h2Agent = new http2.Agent({
            maxSessions: 100,
            timeout: 30_000,
        });
        // @ts-ignore
        dns.install(h2Agent);

        // Adapter HTTP/2 dibungkus dedupe in-flight
        const h2Adapter = createHTTP2Adapter({ agent: h2Agent });
        const adapter = makeDedupeAdapter(h2Adapter as unknown as AdapterFn, {
            methods: ['get'],  // dedupe GET saja (idempotent)
            cooldownMs: 0      // murni in-flight, tidak nyimpan hasil
        });

        // Axios instance
        apiInstance = axios.create({
            baseURL,
            adapter,
            httpsAgent, // fallback H1 + mTLS config
            headers: { 'Accept-Encoding': 'br, gzip, deflate' }, // H2: jangan pakai 'Connection'
            timeout: 15_000,
            maxRedirects: 0,
            decompress: true,
        });

        // (Opsional) timing sederhana
        // @ts-ignore
        apiInstance.interceptors.request.use((c) => ((c.headers = { ...(c.headers || {}), 'x-start': String(Date.now()) }), c));
        apiInstance.interceptors.response.use((r) => ((r.headers['x-ttfb'] = String(Date.now() - Number(r.config.headers?.['x-start']))), r));
    })();

    return initPromise;
}

/* =========================
   Public API
   ========================= */
/** Ambil AxiosInstance terkonfigurasi (HTTP/2 + mTLS + DNS cache + dedupe in-flight) */
export async function getApi(): Promise<AxiosInstance> {
    await ensureInited();
    return apiInstance!;
}

/** Hot-swap baseURL (persist ke SQLite & update defaults) */
export async function setBaseURL(nextUrl: string): Promise<void> {
    await ensureInited();
    await repo!.set(CFG_KEY_BASE_URL, nextUrl);
    apiInstance && (apiInstance.defaults.baseURL = nextUrl);
}

/** Baca baseURL saat ini */
export async function getBaseURL(): Promise<string> {
    await ensureInited();
    return (await repo!.get(CFG_KEY_BASE_URL)) || DEFAULT_BASE_URL;
}

/** Tutup resource saat app quit */
export async function closeApiConfig(): Promise<void> {
    repo && (await repo.close());
    repo = null;
    apiInstance = null;
    initPromise = null;
}
app.on('quit', () => void closeApiConfig());

/* =========================
   Catatan pemakaian realtime
   =========================
   - Dedupe ini TIDAK menyimpan cache. Request identik yang sedang berjalan akan ‘digabung’.
   - Untuk endpoint realtime/polling, bypass dedupe:
       api.get('/metrics', { params: {...}, skipDedupe: true });
   - Untuk SSE/WebSocket, gunakan EventSource/WebSocket (axios kurang cocok untuk stream kontinu).
*/
