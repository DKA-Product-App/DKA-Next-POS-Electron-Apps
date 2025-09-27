import axios from "axios";
import { createHTTP2Adapter } from 'axios-http2-adapter';
import * as https from "node:https";
import * as path from "node:path";
import * as fs from "fs";

import http2 from "http2-wrapper";
import {app} from "electron";

// CA di DALAM asar (prod) / root project (dev)
const CA_FILE = path.join(app.getAppPath(), 'resources', 'cert', 'ca', 'certificate.crt');

// Client cert/key di LUAR asar (prod) / di repo (dev)
const CLIENT_DIR = app.isPackaged
    ? path.join(process.resourcesPath, 'cert', 'client')             // prod → .../resources/cert/client
    : path.join(process.cwd(), 'resources', 'cert', 'client');       // dev  → ./resources/cert/client

const ApiRequestInstance = axios.create({
    baseURL: 'https://127.0.0.1:8083',
    adapter: createHTTP2Adapter({ agent: new http2.Agent() }),
    httpsAgent: new https.Agent({
        ca:   [fs.readFileSync(CA_FILE, 'utf-8')],                     // ← dari ASAR
        cert:  fs.readFileSync(path.join(CLIENT_DIR, 'certificate.crt'), 'utf-8'),
        key:   fs.readFileSync(path.join(CLIENT_DIR, 'private.key'), 'utf-8'),
        rejectUnauthorized: true,
        requestCert: true
    })
});

export { ApiRequestInstance };