// products.variants.type.ts
import type { Products, ReferenceUser, Branch } from './products.type'

/**
 * Satu baris varian seperti di contoh JSON: ada relasi ke product, branches, dan reference user.
 * price berupa string (mis. "31000.00") sesuai payload.
 */
export type ProductsVariants = {
    id: string
    code: string
    name: string
    description: string
    price: string
    time_created: string // ISO string
    time_updated: string // ISO string
    reference: ReferenceUser
    branches: Branch[]
    product: Products
}
