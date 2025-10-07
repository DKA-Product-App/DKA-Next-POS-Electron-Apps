// Auto-generated from sample payload (2025-09-23)
// Semua field dibuat optional ("?") sesuai permintaan.
// Catatan: Field yang di payload bisa bernilai null; maka tipe mencakup null juga.

import {ProductsVariants} from "../../(transaction)/types/products.variants.type";

export type UUID = string
export type ISODate = string

// Helper generic untuk nilai yang bisa null
export type Maybe<T> = T | null

export interface ApiResponseTransactionBill {
    status?: boolean
    code?: number
    msg?: string
    data?: TransactionBill[]
}


export interface TransactionBillPaid {
    id?: UUID;
    bill?: TransactionBill
    status?: boolean;
    payment_method?: Maybe<TransactionBillPaymentMethod>;
    time_created?: ISODate
    time_updated?: ISODate
}

export interface TransactionBill {
    id?: UUID
    bill?: number
    paid?: TransactionBillPaid
    time_created?: ISODate
    time_updated?: ISODate
    reference?: TransactionBillReferenceUser
    branch?: TransactionBillBranch[]
    transaction?: TransactionBillTransaction
    items?: TransactionBillItem[]
    is_hide?: boolean;
}

export interface TransactionBillReferenceUser {
    id?: UUID
    name?: TransactionBillPersonName
    username?: string
    password?: string
    time_created?: ISODate
    time_updated?: ISODate
}

export interface TransactionBillPersonName {
    last_name?: string
    first_name?: string
}

export interface TransactionBillBranch {
    id?: UUID
    name?: string
    address?: string
    phone?: string
    email?: string
    website?: Maybe<string>
    time_created?: ISODate
    time_updated?: ISODate
    reference?: TransactionBillReferenceUser
}

export interface TransactionBillTransaction {
    id?: UUID
    invoice?: string
    time_created?: ISODate
    time_updated?: ISODate
    time_closed?: Maybe<ISODate>
    reference?: TransactionBillReferenceUser
    branch?: TransactionBillBranch[]
    shift?: TransactionBillShift
    order_type?: TransactionBillOrderType
    table?: Maybe<TransactionBillTable>
    batches?: TransactionBillBatch[]
}

export interface TransactionBillShift {
    id?: UUID
    name?: string
    start_time?: string // "HH:mm"
    end_time?: string   // "HH:mm"
    status?: boolean
    time_created?: ISODate
    time_updated?: ISODate
    reference?: TransactionBillReferenceUser
}

export interface TransactionBillOrderType {
    id?: UUID
    code?: string
    name?: string
    icon?: string
    description?: string
    required_table_select?: boolean
    status?: boolean
    time_created?: ISODate
    time_updated?: ISODate
    reference?: TransactionBillReferenceUser
}

export interface TransactionBillTable {
    id?: UUID
    code?: string
    name?: string
    // Masih minimal—extend kalau ada payload meja yang lebih lengkap
}

export interface TransactionBillBatch {
    id?: UUID
    batch?: number
    note?: Maybe<string>
    time_created?: ISODate
    time_updated?: ISODate
    reference?: Maybe<TransactionBillReferenceUser>
}

export interface TransactionBillPaymentMethod {
    id?: UUID
    icon?: string
    name: string
    description?: string
    need_tender?: boolean
    status?: boolean
    // Detail belum muncul di sample (null). Tambahkan saat tersedia.
}

export interface TransactionBillItem {
    id?: UUID
    reference?: Maybe<TransactionBillReferenceUser>
    qty?: number
    price?: number
    sub_total?: number
    status?: boolean
    time_created?: ISODate
    time_updated?: ISODate
    branch?: TransactionBillBranch[]
    productVariant?: Maybe<ProductsVariants>
}

/** ====== NEW / EXPANDED STRUCTURES FROM SAMPLE ====== */

// Item transaksi (source dari keranjang) yang dipetakan ke bill item
export interface TransactionBillTransactionItem {
    id?: UUID
    qty?: number
    price?: number
    sub_total?: number
    note?: string
    time_created?: ISODate
    time_updated?: ISODate
    void?: Maybe<TransactionBillVoidInfo>
    reference?: Maybe<TransactionBillReferenceUser>
    product?: TransactionBillProduct
    variant?: TransactionBillProductVariant
}

// Informasi pembatalan (void) — placeholder, karena sample bernilai null
export interface TransactionBillVoidInfo {
    // Extend saat struktur void tersedia di payload lain
}

// Produk yang direferensikan oleh item
export interface TransactionBillProduct {
    id?: UUID
    name?: string
    description?: string
    image?: string
    time_created?: ISODate
    time_updated?: ISODate
    status?: boolean
    category?: TransactionBillProductCategory[]
}

// Kategori produk
export interface TransactionBillProductCategory {
    id?: UUID
    name?: string
    description?: string
    time_created?: ISODate
    time_updated?: ISODate
    status?: boolean
    printer?: TransactionBillPrinterDevice[]
}

// Perangkat printer di kategori (untuk routing cetak)
export interface TransactionBillPrinterDevice {
    id?: UUID
    name?: string
    description?: string
    options?: TransactionBillPrinterOptions
    time_created?: ISODate
    time_updated?: ISODate
    status?: boolean
}

// Opsi koneksi printer
export interface TransactionBillPrinterOptions {
    mode?: 'NETWORK' | string          // literal dari sample: "NETWORK"
    port?: number                      // 9100
    timeout?: number                   // 10000 (ms)
    ip_address?: string                // "192.168.1.8"
}

// Variant produk yang dipilih
export interface TransactionBillProductVariant {
    id?: UUID
    code?: string
    name?: string
    description?: string
    price?: string
    time_created?: ISODate
    time_updated?: ISODate
}

// ===== Convenience Type =====
export type TransactionBills = TransactionBill[]
