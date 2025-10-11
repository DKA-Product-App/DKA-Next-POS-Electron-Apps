/* ===========================
 * Product Catalog API Types
 * Berdasarkan payload JSON yang dikirim
 * =========================== */

import {ProductsCategories} from "./product.categories.type";
import {Accounts} from "../account/accounts.type";
import {ConfigBranch} from "../config/base/branch.type";
import {ProductsVariants} from "./products.variants.type";

/** Wrapper response utama */
export interface ApiProductsResponse {
    status: boolean;
    code: number;
    msg: string;
    data: Products[];
}

/** Produk lengkap */
export interface Products {
    id: string;
    reference?: Accounts;
    branches?: ConfigBranch[];
    category?: ProductsCategories[];
    name?: string;
    description?: string | null;
    image?: string | null;
    variants?: ProductsVariants[];
    time_created?: string; // ISO
    time_updated?: string; // ISO
    time_deleted?: string | null;
    status?: boolean;
}
