'use strict';

import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import * as https from 'node:https';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { app } from 'electron';
import CacheableLookup from 'cacheable-lookup';

import { ConfigRepository } from '../../repositories/config';

/* =========================
   Konfigurasi & Singletons
   ========================= */
const CFG_KEY_BASE_URL = 'api.base_url';
const DEFAULT_BASE_URL = 'https://192.168.1.253:8083'; // akan di-convert ke wss://

let repo: ConfigRepository | null = null;
let socket: Socket | null = null;
let initPromise: Promise<void> | null = null;
let currentBaseURL: string = DEFAULT_BASE_URL;

/* =========================
   Path Sertifikat (mTLS)
   ========================= */
const getCaFilePath = () => path.join(app.getAppPath(), 'resources', 'cert', 'ca', 'certificate.crt');
const getClientDir = () =>
    app.isPackaged ? path.join(process.resourcesPath, 'cert', 'client') : path.join(process.cwd(), 'resources', 'cert', 'client');

/* =========================
   Utils
   ========================= */
const toWsURL = (url: string) => {
    try {
        const u = new URL(url);
        u.protocol = u.protocol === 'http:' ? 'ws:' : 'wss:';
        return u.toString().replace(/\/+$/, ''); // trim trailing slash
    } catch {
        return url;
    }
};

const buildHttpsAgent = (ca: Buffer, cert: Buffer, key: Buffer) => {
    const dns = new CacheableLookup({ maxTtl: 60, errorTtl: 0 });
    const agent = new https.Agent({
        ca: [ca],
        cert,
        key,
        rejectUnauthorized: true,
        requestCert: true,
        keepAlive: true,
        maxSockets: 256,
        maxFreeSockets: 64,
        keepAliveMsecs: 30_000,
        // servername: 'host.sesuai.cert', // set kalau akses via IP tapi cert pakai hostname
    });
    dns.install(agent);
    return { agent, dns };
};

/* =========================
   Dedupe in-flight untuk emit (tanpa cache)
   ========================= */
type DedupeKeyFn = (event: string, payload?: any) => string;
const makeEmitterDedupe = (opts?: { key?: DedupeKeyFn; cooldownMs?: number; methods?: string[] }) => {
    const inflight = new Map<string, Promise<any>>();
    const lastDoneAt = new Map<string, number>();
    const keyOf = opts?.key ?? ((e, p) => `${e}:${JSON.stringify(p ?? {})}`);
    const cooldown = Math.max(0, opts?.cooldownMs ?? 0);

    return <T = any>(emitFn: (event: string, payload?: any, timeoutMs?: number) => Promise<T>) =>
        (event: string, payload?: any, timeoutMs = 15_000, skipDedupe = false): Promise<T> => {
            if (skipDedupe) return emitFn(event, payload, timeoutMs);

            const k = keyOf(event, payload);
            const doneAt = lastDoneAt.get(k) || 0;
            if (cooldown && Date.now() - doneAt < cooldown) {
                const p = inflight.get(k);
                return p ? (p as Promise<T>) : emitFn(event, payload, timeoutMs);
            }

            const p = inflight.get(k) || emitFn(event, payload, timeoutMs).finally(() => {
                inflight.delete(k);
                lastDoneAt.set(k, Date.now());
            });
            inflight.set(k, p);
            return p as Promise<T>;
        };
};

/* =========================
   Init: Repo + Socket.IO (WebSocket + mTLS)
   ========================= */
async function ensureInited() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (!app.isReady()) await app.whenReady();

        // Repo & baseURL
        repo = new ConfigRepository();
        await repo.init({ [CFG_KEY_BASE_URL]: DEFAULT_BASE_URL });
        currentBaseURL = (await repo.get(CFG_KEY_BASE_URL)) || DEFAULT_BASE_URL;

        // Load certs (Buffer-friendly untuk TLS)
        const ca = fs.readFileSync(getCaFilePath());
        const CLIENT_DIR = getClientDir();
        const cert = fs.readFileSync(path.join(CLIENT_DIR, 'certificate.crt'));
        const key = fs.readFileSync(path.join(CLIENT_DIR, 'private.key'));

        // Agent + DNS cache untuk polling & ws (Node env)
        const { agent } = buildHttpsAgent(ca, cert, key);

        // Opsi Socket.IO (Node): pass agent & TLS ke kedua transport
        const wsUrl = toWsURL(currentBaseURL);
        const managerOpts: Partial<ManagerOptions & SocketOptions> = {
            transports: ['websocket', 'polling'],
            forceNew: false,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            extraHeaders: { 'Accept-Encoding': 'br, gzip, deflate' },
            timeout: 15_000,
            // Untuk Engine.IO di Node, kita teruskan agent/TLS ke ws & polling:
            transportOptions: {
                websocket: {
                    agent,
                    ca: [ca],
                    cert,
                    key,
                    rejectUnauthorized: true,
                    // servername: 'host.sesuai.cert',
                },
                polling: {
                    agent, // dipakai saat fallback long-polling
                },
            },
        };

        // Connect
        socket = io(wsUrl, managerOpts);

        // (Opsional) log ringan biar kelihatan napasnya
        socket.on('connect', () => socket && socket.emit('client:hello', { ts: Date.now(), ua: 'electron' }));
        socket.on('reconnect', (n) => void n);
        socket.on('disconnect', (why) => void why);
        socket.on('connect_error', (err) => void err);
    })();

    return initPromise;
}

/* =========================
   Helper emit → Promise (ack)
   ========================= */
const rawEmit = <T = any>(event: string, payload?: any, timeoutMs = 15_000): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        if (!socket) return reject(new Error('Socket belum siap'));
        // socket.timeout memberi hard-timeout pada ack
        socket.timeout(timeoutMs).emit(event, payload ?? null, (err: any, res: T) => (err ? reject(err) : resolve(res)));
    });

// Bungkus dengan dedupe in-flight (default aktif untuk event "idempotent")
const emitDedupe = makeEmitterDedupe({ cooldownMs: 0 });

/* =========================
   Public API
   ========================= */
/** Ambil instance Socket.IO yang sudah terhubung */
export async function getSocket(): Promise<Socket> {
    await ensureInited();
    return socket!;
}

/** Emit dengan Promise + dedupe in-flight (default on).
 *  Gunakan skipDedupe=true untuk realtime/polling-like stream. */
export async function emit<T = any>(
    event: string,
    payload?: any,
    timeoutMs = 15_000,
    skipDedupe = false
): Promise<T> {
    await ensureInited();
    return emitDedupe<T>(rawEmit)(event, payload, timeoutMs, skipDedupe);
}

/** Hot-swap baseURL (persist ke SQLite & reconnect) */
export async function setBaseURL(nextUrl: string): Promise<void> {
    await ensureInited();
    await repo!.set(CFG_KEY_BASE_URL, nextUrl);
    currentBaseURL = nextUrl;

    // Reconnect dengan URL baru
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
    initPromise = null; // reset init chain
    await ensureInited(); // connect ulang ke endpoint baru
}

/** Baca baseURL saat ini */
export async function getBaseURL(): Promise<string> {
    await ensureInited();
    return currentBaseURL || DEFAULT_BASE_URL;
}

/** Tutup resource saat app quit */
export async function closeApiConfig(): Promise<void> {
    socket && socket.disconnect();
    socket = null;

    repo && (await repo.close());
    repo = null;

    initPromise = null;
}
app.on('quit', () => void closeApiConfig());

/* =========================
   Catatan pemakaian realtime
   =========================
   - Gunakan emit('event', payload) bila server mengembalikan ACK:
       emit('product:readAll', { page: 1 }).then(console.log).catch(console.error)
   - Dedupe in-flight aktif default. Untuk event realtime (mis. metrics), bypass:
       emit('metrics:pull', { since }, 15000, true);
   - Untuk stream kontinu (SSE/WebSocket custom), cukup on/off:
       const s = await getSocket();
       s.on('tx:update', (msg) => { ... });
       s.off('tx:update');
*/
