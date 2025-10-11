/* =======================================================
 * Transaction Bill Item API Types (standalone)
 * Root: ApiTransactionBillItemFull
 * ======================================================= */

import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../../config/base/branch.type";
import {TransactionBill} from "./transaction.bill.type";
import {ProductsVariants} from "../../product/products.variants.type";

/** ==== ROOT TYPE: ApiTransactionBillItemFull ==== */
export interface TransactionBillItem {
    id?: string;
    qty?: number;
    price?: string | number;           // "22000.00"
    sub_total?: string | number;       // "22000.00"
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
    status?: boolean;        // false pada sample
    reference?: Accounts;
    branch?: ConfigBranch[];    // [] pada sample
    bill?: TransactionBill;        // konteks bill lengkap
    productVariant?: ProductsVariants;   // detail variant untuk item ini
}

export interface ApiTransactionBillItemResponse {
    status: boolean;
    code: number;
    msg: string;
    data: TransactionBillItem | TransactionBillItem[];
}
