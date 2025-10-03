import { BrowserWindow } from "electron";
import { compile } from "path-to-regexp";
import {getApi} from "../../../functions/api/api.request.instance";
import { ApiConfig } from "../../../config/api.config";

export function ApiConfigDataFloors(mainWindow?: BrowserWindow) {

    // CREATE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors:create", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors`);
        return new Promise(async (resolve, reject) => {
            const ApiRequestInstance = await getApi();
            return ApiRequestInstance({
                url: toPath(),
                method: "POST",
                data: args,
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch((err) => {
                    const pack = (payload: any) => {
                        const e = new Error(JSON.stringify(payload)); // <-- kirim JSON di message
                        (e as any).data = payload;                    // <-- bonus: taruh raw data kalau Electron gak nyopot
                        (e as any).code = payload?.code ?? 530;
                        return reject(e);
                    };

                    if (err?.response?.data) return pack(err.response.data);

                    const code = err?.code;
                    if (code === "ENOTFOUND")    return pack({ status: false, code: 530, msg: "Host tidak ditemukan" });
                    if (code === "ECONNREFUSED") return pack({ status: false, code: 530, msg: "Koneksi ditolak oleh server" });
                    if (code === "ETIMEDOUT" || code === "ECONNABORTED")
                        return pack({ status: false, code: 530, msg: "Waktu koneksi habis" });

                    const isNetwork = typeof err?.message === "string" && err.message.includes("Network Error");
                    return pack({
                        status: false,
                        code: 530,
                        msg: isNetwork ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server"
                    });
                });
        });
    });

    // READ ALL
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors:read.all", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors`);
        return new Promise(async (resolve, reject) => {
            const ApiRequestInstance = await getApi();
            return ApiRequestInstance({
                url: toPath(),
                method: "GET",
                params: args,
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch((err) => {
                    const pack = (payload: any) => {
                        const e = new Error(JSON.stringify(payload)); // <-- kirim JSON di message
                        (e as any).data = payload;                    // <-- bonus: taruh raw data kalau Electron gak nyopot
                        (e as any).code = payload?.code ?? 530;
                        return reject(e);
                    };

                    if (err?.response?.data) return pack(err.response.data);

                    const code = err?.code;
                    if (code === "ENOTFOUND")    return pack({ status: false, code: 530, msg: "Host tidak ditemukan" });
                    if (code === "ECONNREFUSED") return pack({ status: false, code: 530, msg: "Koneksi ditolak oleh server" });
                    if (code === "ETIMEDOUT" || code === "ECONNABORTED")
                        return pack({ status: false, code: 530, msg: "Waktu koneksi habis" });

                    const isNetwork = typeof err?.message === "string" && err.message.includes("Network Error");
                    return pack({
                        status: false,
                        code: 530,
                        msg: isNetwork ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server"
                    });
                });
        });
    });

    // READ ONE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors:read.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/:id`);
        return new Promise(async (resolve, reject) => {
            const ApiRequestInstance = await getApi();
            return ApiRequestInstance({
                url: toPath(args),
                method: "GET",
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch((err) => {
                    const pack = (payload: any) => {
                        const e = new Error(JSON.stringify(payload)); // <-- kirim JSON di message
                        (e as any).data = payload;                    // <-- bonus: taruh raw data kalau Electron gak nyopot
                        (e as any).code = payload?.code ?? 530;
                        return reject(e);
                    };

                    if (err?.response?.data) return pack(err.response.data);

                    const code = err?.code;
                    if (code === "ENOTFOUND")    return pack({ status: false, code: 530, msg: "Host tidak ditemukan" });
                    if (code === "ECONNREFUSED") return pack({ status: false, code: 530, msg: "Koneksi ditolak oleh server" });
                    if (code === "ETIMEDOUT" || code === "ECONNABORTED")
                        return pack({ status: false, code: 530, msg: "Waktu koneksi habis" });

                    const isNetwork = typeof err?.message === "string" && err.message.includes("Network Error");
                    return pack({
                        status: false,
                        code: 530,
                        msg: isNetwork ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server"
                    });
                });
        });
    });

    // UPDATE ONE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors:update.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/:id`);
        return new Promise(async (resolve, reject) => {
            const ApiRequestInstance = await getApi();
            return ApiRequestInstance({
                url: toPath(args),
                method: "PUT",
                data: args,
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch((err) => {
                    const pack = (payload: any) => {
                        const e = new Error(JSON.stringify(payload)); // <-- kirim JSON di message
                        (e as any).data = payload;                    // <-- bonus: taruh raw data kalau Electron gak nyopot
                        (e as any).code = payload?.code ?? 530;
                        return reject(e);
                    };

                    if (err?.response?.data) return pack(err.response.data);

                    const code = err?.code;
                    if (code === "ENOTFOUND")    return pack({ status: false, code: 530, msg: "Host tidak ditemukan" });
                    if (code === "ECONNREFUSED") return pack({ status: false, code: 530, msg: "Koneksi ditolak oleh server" });
                    if (code === "ETIMEDOUT" || code === "ECONNABORTED")
                        return pack({ status: false, code: 530, msg: "Waktu koneksi habis" });

                    const isNetwork = typeof err?.message === "string" && err.message.includes("Network Error");
                    return pack({
                        status: false,
                        code: 530,
                        msg: isNetwork ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server"
                    });
                });
        });
    });

    // DELETE ONE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors:delete.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/:id`);
        return new Promise(async (resolve, reject) => {
            const ApiRequestInstance = await getApi();
            return ApiRequestInstance({
                url: toPath(args),
                method: "DELETE",
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch((err) => {
                    const pack = (payload: any) => {
                        const e = new Error(JSON.stringify(payload)); // <-- kirim JSON di message
                        (e as any).data = payload;                    // <-- bonus: taruh raw data kalau Electron gak nyopot
                        (e as any).code = payload?.code ?? 530;
                        return reject(e);
                    };

                    if (err?.response?.data) return pack(err.response.data);

                    const code = err?.code;
                    if (code === "ENOTFOUND")    return pack({ status: false, code: 530, msg: "Host tidak ditemukan" });
                    if (code === "ECONNREFUSED") return pack({ status: false, code: 530, msg: "Koneksi ditolak oleh server" });
                    if (code === "ETIMEDOUT" || code === "ECONNABORTED")
                        return pack({ status: false, code: 530, msg: "Waktu koneksi habis" });

                    const isNetwork = typeof err?.message === "string" && err.message.includes("Network Error");
                    return pack({
                        status: false,
                        code: 530,
                        msg: isNetwork ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server"
                    });
                });
        });
    });

}

export default ApiConfigDataFloors;
