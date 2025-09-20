// category.type.ts
import type { ReferenceUser, Branch } from './products.type'

/** Printer ringan (cukup untuk routing dapur/bar) */
export type ConfigDevicePrinter = {
    id: string
    name: string
    description?: string
    // optional metadata — aman diabaikan kalau backend belum kirim
    interface?: 'USB' | 'SERIAL' | 'NETWORK' | string
    brand?: string | null
    model?: string | null
    ip_address?: string | null
    port?: number | null
    time_created?: string
    time_updated?: string
}

/** Kategori produk (sering dipakai buat routing printer) */
export type Category = {
    id: string
    code?: string
    name: string
    description?: string
    image?: string | null
    status?: boolean
    time_created: string   // ISO string
    time_updated: string   // ISO string
    reference?: ReferenceUser
    branches?: Branch[]
    /**
     * Banyak payload di lapangan pakai array:
     * akses aman: category.printer?.[0]?.name
     */
    printer?: ConfigDevicePrinter[] | ConfigDevicePrinter | null
}
