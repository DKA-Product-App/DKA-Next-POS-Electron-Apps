import {Accounts} from "../account/accounts.type";
import {ConfigBranch} from "../config/base/branch.type";
import {ConfigShift} from "../config/data/shift.type";
import {ConfigOrderType} from "../config/data/order.type.type";
import {FloorsTables} from "../config/data/floors.tables.type";
import {TransactionBatch} from "./batch/transaction.batch.type";
import {TransactionBill} from "./bill/transaction.bill.type";


export interface Transaction {
    id?: string,
    reference?: Accounts,
    branch?: ConfigBranch[];
    shift?: ConfigShift,
    order_type?: ConfigOrderType,
    table?: FloorsTables,
    batches?: TransactionBatch[],
    bills?: TransactionBill[]
    invoice?: string,
    time_created?: string,
    time_updated?: string,
    time_deleted?: string,
    time_closed?: string,

}