import { BrowserWindow } from "electron";
import { compile } from "path-to-regexp";
import { ApiRequestInstance } from "../../../functions/api/api.request.instance";
import { ApiConfig } from "../../../config/api.config";

export function ApiConfigDataFloorsTables(mainWindow?: BrowserWindow) {

    // CREATE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors.tables:create", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/tables`);
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

    // READ ALL
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors.tables:read.all", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/tables`);
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
                    if (err && err.response)
                        return reject({
                            status: false,
                            code: err.response.status ? err.response.status : 0,
                            msg: (err.response.data && (err.response.data.message || err.response.data.msg)) || err.response.statusText || "Terjadi kesalahan",
                            data: err.response.data ? err.response.data : null,
                            error: { ...err, detail: { errno: err.errno, syscall: err.syscall, address: err.address, port: err.port } },
                            meta: { ...err.response.config },
                        });

                    //
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

    // READ ONE
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors.tables:read.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/tables/:id`);
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
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors.tables:update.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/tables/:id`);
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
    mainWindow?.webContents?.ipc?.handle?.("api.config.data.floors.tables:delete.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/config/data/floors/tables/:id`);
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

export default ApiConfigDataFloorsTables;
