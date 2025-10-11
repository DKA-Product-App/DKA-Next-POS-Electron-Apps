import {Accounts} from "../../account/accounts.type";
import {TransactionBatchItem} from "./transaction.batch.item.type";
import {Transaction} from "../transaction.type";


export interface TransactionBatch {
    id?: string,
    reference?: Accounts,
    transaction?: Transaction,
    batch?: string,
    items?: TransactionBatchItem[]
    note?: string,
    time_created?: string,
    time_updated?: string,
    time_deleted?: string,
}