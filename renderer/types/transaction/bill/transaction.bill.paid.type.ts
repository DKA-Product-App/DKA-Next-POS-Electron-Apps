/* =======================================================
 * Transaction Bill Paid Detail API Types (standalone)
 * Root: ApiTransactionBillPaidDetail
 * ======================================================= */

import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../../config/base/branch.type";
import {TransactionBill} from "./transaction.bill.type";

/** ==== ROOT TYPE: ApiTransactionBillPaid ==== */
export interface TransactionBillPaid {
    id?: string;
    status?: boolean;
    tender?: string;             // "108900.00"
    time_created?: string;
    time_updated?: string;
    time_deleted?: string | null;
    reference?: Accounts | null; // pada sample: null
    branch?: ConfigBranch[];             // pada sample: []
    bill?: TransactionBill;    // detail bill + transaction/items
}

export interface ApiTransactionBillPaidResponse {
  status: boolean;
  code: number;
  msg: string;
  data: TransactionBillPaid | TransactionBillPaid[];
}
