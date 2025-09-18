import {BrowserWindow} from "electron";
import { compile } from "path-to-regexp";
import { ApiConfig } from "../../config/api.config";
import { ApiRequestInstance } from "../../functions/api/api.request.instance";
import { Printer } from "@dkaframework/iot";

const printer = new Printer.Escpos({
    state: Printer.Escpos.Options.STATE.DEVELOPMENT,
    connection: Printer.Escpos.Options.CONNECTION.ESCPOS_NETWORK,
    address: "192.168.1.8",
    port: 9100,
    settings: {
        showNetwork: false,
        showSystem: false,
        showLibrary: false,
        autoCut: false,
        autoClose: true,
    },
});
export function Transaction(mainWindow ?: BrowserWindow) {
    // CREATE
    mainWindow?.webContents?.ipc?.handle?.("api.transaction:create", (_event, args) => {
        mainWindow?.webContents?.ipc?.removeHandler?.("api.config.base.corporation:create")
        const toPath = compile(`/v${ApiConfig.version}/resources/transaction`);
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
    mainWindow?.webContents?.ipc?.handle?.("api.transaction:read.all", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/transaction`);
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
    mainWindow?.webContents?.ipc?.handle?.("api.transaction:read.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/transaction/:id`);
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
    mainWindow?.webContents?.ipc?.handle?.("api.transaction:update.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/transaction/:id`);
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
    mainWindow?.webContents?.ipc?.handle?.("api.transaction:delete.one", (_event, args) => {
        const toPath = compile(`/v${ApiConfig.version}/resources/transaction/:id`);
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

    // DELETE ONE
    mainWindow?.webContents?.ipc?.handle?.("api.transaction:print", (_event, args) => {
        return printer
            .Job(async (p) => {
                // --- reset & “rapetin” ---
                p
                    .encode("cp437")
                    .font("A")
                    .style("normal")
                    .size(0.5, 0.5)
                    .raw(Buffer.from([0x1b, 0x20, 0x00]))             // ESC SP 0 -> character spacing 0 (rapat)

                p
                    .size(2,2)
                    .style("B")
                    .text("Athena Caffe & Resto")
                    .size(1, 1)
                    .style("I")
                    .text("Center Point Indonesia")
                    .size(0.5, 0.5)
                    .feed(1)
                    .drawLine()
                    .feed(2)
                    .style("NORMAL")

                p.size(1, 1)
                    .text("Order Receipt")
                    .size(0.5, 0.5)
                    .drawLine()
                    .feed(2);
                // --- header ringkas ---

                p
                    .size(0,0)
                    .tableCustom([
                        { text: "Kasir", align: "LEFT", width: 0.35, style: "B", },
                        { text: `${args.header.reference.name.first_name} ${args.header.reference.name.last_name ?? ""}`.trim(), align: "RIGHT", style: "B", width: 0.65 },
                    ])
                    .tableCustom([
                        { text: "Shift", align: "LEFT", width: 0.35, style: "B" },
                        { text: `${args.header.shift.name}`, align: "RIGHT", style: "B",  width: 0.65 },
                    ])
                    .tableCustom([
                        { text: "Meja", align: "LEFT", width: 0.35, style: "B" },
                        { text: `${args.header.table.floor.name} - ${args.header.table.name}`, align: "RIGHT", style: "B", width: 0.65 },
                    ])
                    .tableCustom([
                        { text: "Invoice", align: "LEFT", width: 0.35, style: "B" },
                        { text: `${args.header.invoice}`, align: "RIGHT", style: "B", width: 0.65 },
                    ])
                    .drawLine();

                // --- items (rapat, nama kiri – qty kanan) ---
                p.tableCustom([
                    { text: `NAMA ITEM`, align: "LEFT", width: 0.70, style: "BU" },
                    { text: `JUMLAH`, align: "RIGHT", width: 0.30, style: "BU" },
                ]).feed(2)
                args.items.forEach((it) => {
                    p.tableCustom([
                        { text: `${it.product.name}${it.variant?.name ? ` (${it.variant.name})` : ""}`, align: "LEFT", width: 0.70, style: "B" },
                        { text: `${it.qty}`, align: "RIGHT", width: 0.30 },
                    ]);
                });

                p.drawLine();

                // --- total (opsional tapi useful) ---
                const total = parseFloat(args.header.total || "0");
                const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total);

                p.tableCustom([
                    { text: "TOTAL", align: "LEFT", width: 0.50, style: "B" },
                    { text: idr, align: "RIGHT", width: 0.50, style: "B" },
                ])
                    .text("".padEnd(42, "="))
                    .align("CT")
                    .text("Terima kasih")
                    .feed(3)
                    .newLine(30)
                    .cut();
            })
    });
}

export default Transaction;