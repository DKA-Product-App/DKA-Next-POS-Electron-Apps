/* =======================================================
 * Transaction Bill API Types (standalone)
 * Root: ApiTransactionBill
 * ======================================================= */

import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../../config/base/branch.type";
import {TransactionBillItem} from "./transaction.bill.item.type";
import {Transaction} from "../transaction.type";
import {TransactionBillPaid} from "./transaction.bill.paid.type";

/** ==== ROOT TYPE: ApiTransactionBill ==== */
export interface TransactionBill {
    id?: string;
    bill?: string;              // ex: "396"
    tax?: number;              // ex: 0.1
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
    reference?: Accounts;
    branch?: ConfigBranch[];      // array pada payload
    transaction?: Transaction;
    items?: TransactionBillItem[];
    paid?: TransactionBillPaid;
    meta?: {
        request_key?: string;
    }
}

export interface ApiTransactionBillResponse {
  status: boolean;
  code: number;
  msg: string;
  data: TransactionBill | TransactionBill[];
}
