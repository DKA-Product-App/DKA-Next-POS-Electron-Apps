import axios from "axios";
import { createHTTP2Adapter } from 'axios-http2-adapter';
import * as https from "node:https";
import * as path from "node:path";
import * as fs from "fs";

import http2 from "http2-wrapper";
import {app} from "electron";

const resolveResource = (...segments: string[]) =>
    app.isPackaged
        ? path.join(process.resourcesPath, 'resources', ...segments) // production
        : path.join(app.getAppPath(), 'resources', ...segments);     // dev

const SSLPath = resolveResource("./cert")

export const ApiRequestInstance = axios.create({
    baseURL : "https://127.0.0.1:8083",
    adapter: createHTTP2Adapter({
        agent: new http2.Agent(),
    }),
    httpsAgent: new https.Agent({
        ca : [ fs.readFileSync(path.join(SSLPath,"./ca/certificate.crt"),'utf-8')],
        cert: fs.readFileSync(path.join(SSLPath,"./client/certificate.crt"),'utf-8'),
        key: fs.readFileSync(path.join(SSLPath,"./client/private.key"),'utf-8'),
        rejectUnauthorized: true,
        requestCert: true,
    }),
})