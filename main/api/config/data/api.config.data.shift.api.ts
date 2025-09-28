import { BrowserWindow } from "electron";
import { compile } from "path-to-regexp";
import { ApiRequestInstance } from "../../../functions/api/api.request.instance";
import { ApiConfig } from "../../../config/api.config";

export function ApiConfigDataShift(mainWindow?: BrowserWindow) {

    // CREATE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.shift:create", (_event, args) => {

        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/shift`);
        return new Promise(async (resolve, reject) => {
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
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.shift:read.all", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/shift`);
        return new Promise(async (resolve, reject) => {
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
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.shift:read.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/shift/:id`);
        return new Promise(async (resolve, reject) => {
            return ApiRequestInstance({
                url: toPath(args),
                method: "GET",
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch((err) => {
                    if (err && err.response)
                        return reject({
                            status: false,
                            code: err.response.status ? err.response.status : 0,
                            msg: (err.response.data && (err.response.data.message || err.response.data.msg)) || err.response.statusText || "Terjadi kesalahan",
                            data: err.response.data ? err.response.data : null,
                            error: { ...err, detail: { errno: err.errno, syscall: err.syscall, address: err.address, port: err.port } },
                            meta: { ...err.response.config },
                        });

                    switch (err && err.code) {
                        case "ENOTFOUND":
                            return reject({ status: false, code: 530, msg: "Host tidak ditemukan", error: err });
                        case "ECONNREFUSED":
                            return reject({ status: false, code: 530, msg: "Koneksi ditolak oleh server", error: err });
                        case "ETIMEDOUT":
                        case "ECONNABORTED":
                            return reject({ status: false, code: 530, msg: "Waktu koneksi habis", error: err });
                        default:
                            return reject({
                                status: false,
                                code: 530,
                                msg: typeof err.message === "string" && err.message.indexOf("Network Error") !== -1 ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server",
                                error: err,
                            });
                    }
                });
        });
    });

    // UPDATE ONE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.shift:update.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/shift/:id`);
        return new Promise(async (resolve, reject) => {
            return ApiRequestInstance({
                url: toPath(args),
                method: "PUT",
                data: args,
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch(async (err) => {
                    if (err && err.response)
                        return reject({
                            status: false,
                            code: err.response.status ? err.response.status : 0,
                            msg: (err.response.data && (err.response.data.message || err.response.data.msg)) || err.response.statusText || "Terjadi kesalahan",
                            data: err.response.data ? err.response.data : null,
                            error: { ...err, detail: { errno: err.errno, syscall: err.syscall, address: err.address, port: err.port } },
                            meta: { ...err.response.config },
                        });

                    switch (err && err.code) {
                        case "ENOTFOUND":
                            return reject({ status: false, code: 530, msg: "Host tidak ditemukan", error: err });
                        case "ECONNREFUSED":
                            return reject({ status: false, code: 530, msg: "Koneksi ditolak oleh server", error: err });
                        case "ETIMEDOUT":
                        case "ECONNABORTED":
                            return reject({ status: false, code: 530, msg: "Waktu koneksi habis", error: err });
                        default:
                            return reject({
                                status: false,
                                code: 530,
                                msg: typeof err.message === "string" && err.message.indexOf("Network Error") !== -1 ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server",
                                error: err,
                            });
                    }
                });
        });
    });

    // DELETE ONE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.shift:delete.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/shift/:id`);
        return new Promise(async (resolve, reject) => {
            return ApiRequestInstance({
                url: toPath(args),
                method: "DELETE",
            })
                .then((response) => {
                    return resolve({ ...response.data });
                })
                .catch(async (err) => {
                    if (err && err.response)
                        return reject({
                            status: false,
                            code: err.response.status ? err.response.status : 0,
                            msg: (err.response.data && (err.response.data.message || err.response.data.msg)) || err.response.statusText || "Terjadi kesalahan",
                            data: err.response.data ? err.response.data : null,
                            error: { ...err, detail: { errno: err.errno, syscall: err.syscall, address: err.address, port: err.port } },
                            meta: { ...err.response.config },
                        });

                    switch (err && err.code) {
                        case "ENOTFOUND":
                            return reject({ status: false, code: 530, msg: "Host tidak ditemukan", error: err });
                        case "ECONNREFUSED":
                            return reject({ status: false, code: 530, msg: "Koneksi ditolak oleh server", error: err });
                        case "ETIMEDOUT":
                        case "ECONNABORTED":
                            return reject({ status: false, code: 530, msg: "Waktu koneksi habis", error: err });
                        default:
                            return reject({
                                status: false,
                                code: 530,
                                msg: typeof err.message === "string" && err.message.indexOf("Network Error") !== -1 ? "Jaringan/offline atau server tidak dapat dijangkau" : "Gagal menghubungi server",
                                error: err,
                            });
                    }
                });
        });
    });

}

export default ApiConfigDataShift;
