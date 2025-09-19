// products.type.ts
// Tipe untuk objek "product" yang nongol di dalam setiap variant (embedded)

export type Name = {
    first_name: string
    last_name?: string
}

export type ReferenceUser = {
    id: string
    name?: Name
    username: string
    password: string
    time_created: string // ISO string
    time_updated: string // ISO string
}

export type Branch = {
    id: string
    name: string
    address: string
    phone: string
    email: string
    website: string | null
    time_created: string // ISO string
    time_updated: string // ISO string
}

/**
 * Product yang tertanam pada variant (payload contoh menunjukkan struktur lengkap).
 * Kalau nanti backend beda (summary vs detail), tinggal pecah ke ProductSummary/ProductDetail.
 */
export type Products = {
    id: string
    name: string
    description: string
    image: string | null
    time_created: string // ISO string
    time_updated: string // ISO string
    status: boolean
}
