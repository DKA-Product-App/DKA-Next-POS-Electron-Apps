/* ============================================
 * Products Variants API Types (standalone)
 * Root: ProductsVariants
 * ============================================ */

import {ConfigBranch} from "../config/base/branch.type";
import {Accounts} from "../account/accounts.type";
import {Products} from "./products.type";


/** ==== ROOT TYPE: ProductsVariants ==== */
export interface ProductsVariants {
    id: string;
    code?: string | null;     // "ICE"
    name: string;             // "Iced"
    description?: string | null;
    price?: string;           // "23000.00" (string sesuai payload)
    time_created?: string;    // ISO
    time_updated?: string;    // ISO
    time_deleted?: string | null;
    reference?: Accounts;
    branches?: ConfigBranch[];
    product?: Products;
}
