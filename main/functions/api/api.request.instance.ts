'use strict';

import axios, { AxiosInstance } from 'axios';
import { createHTTP2Adapter } from 'axios-http2-adapter';
import * as https from 'node:https';
import * as path from 'node:path';
import * as fs from 'node:fs';
import http2 from 'http2-wrapper';
import { app } from 'electron';

import { ConfigRepository } from '../../repositories/config'; // <-- sesuaikan path

// ====== Konfigurasi key di SQLite ======
const CFG_KEY_BASE_URL = 'api.base_url';
const DEFAULT_BASE_URL  = 'https://127.0.0.1:8083';

// ====== Singletons / memo ======
let repo: ConfigRepository | null = null;
let apiInstance: AxiosInstance | null = null;
let initPromise: Promise<void> | null = null;

// ====== Helper path sertifikat ======
function getCaFilePath() {
    // CA di DALAM asar (prod) / root project (dev)
    return path.join(app.getAppPath(), 'resources', 'cert', 'ca', 'certificate.crt');
}

function getClientDir() {
    // Client cert/key di LUAR asar (prod) / di repo (dev)
    return app.isPackaged
        ? path.join(process.resourcesPath, 'cert', 'client')     // prod → .../resources/cert/client
        : path.join(process.cwd(), 'resources', 'cert', 'client'); // dev  → ./resources/cert/client
}

// ====== Inisialisasi repository + seed default ======
async function ensureInited() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // nunggu Electron siap (biar app.getAppPath & resourcesPath valid)
        if (!app.isReady()) {
            await app.whenReady();
        }

        // siapkan repo config + schema + seed default baseURL (non-overwrite)
        repo = new ConfigRepository();
        await repo.init({ [CFG_KEY_BASE_URL]: DEFAULT_BASE_URL });

        // siapkan axios instance pertama kali
        const baseURL = (await repo.get(CFG_KEY_BASE_URL)) || DEFAULT_BASE_URL;

        const CA_FILE = getCaFilePath();
        const CLIENT_DIR = getClientDir();

        // baca cert sekali
        const ca = fs.readFileSync(CA_FILE, 'utf-8');
        const cert = fs.readFileSync(path.join(CLIENT_DIR, 'certificate.crt'), 'utf-8');
        const key  = fs.readFileSync(path.join(CLIENT_DIR, 'private.key'), 'utf-8');

        apiInstance = axios.create({
            baseURL,
            adapter: createHTTP2Adapter({ agent: new http2.Agent() }),
            httpsAgent: new https.Agent({
                ca: [ca],
                cert,
                key,
                rejectUnauthorized: true,
                requestCert: true,
            }),
        });
    })();

    return initPromise;
}

/**
 * Ambil AxiosInstance yang sudah terkonfigurasi pakai baseURL dari SQLite.
 * Panggil ini di main process / preload / worker node (bukan renderer).
 */
export async function getApi(): Promise<AxiosInstance> {
    await ensureInited();
    // apiInstance dijamin non-null setelah ensureInited
    return apiInstance!;
}

/**
 * Update baseURL di runtime:
 * - Simpan ke SQLite
 * - Update axios.defaults.baseURL (hot-swap) tanpa re-init agent/cert
 */
export async function setBaseURL(nextUrl: string): Promise<void> {
    await ensureInited();
    // simpan ke DB
    await repo!.set(CFG_KEY_BASE_URL, nextUrl);
    // update live axios instance
    if (apiInstance) {
        apiInstance.defaults.baseURL = nextUrl;
    }
}

/**
 * Opsional: baca baseURL saat ini (sesuai DB)
 */
export async function getBaseURL(): Promise<string> {
    await ensureInited();
    return (await repo!.get(CFG_KEY_BASE_URL)) || DEFAULT_BASE_URL;
}

/**
 * Opsional: tutup repo saat shutdown app
 */
export async function closeApiConfig(): Promise<void> {
    if (repo) {
        await repo.close();
        repo = null;
    }
    apiInstance = null;
    initPromise = null;
}
app.on('quit', () => {
    void closeApiConfig();
})
