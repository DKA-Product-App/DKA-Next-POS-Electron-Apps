import {Accounts} from "../../account/accounts.type";


export interface TransactionBatchItemVoid {
    id?: string,
    reference?: Accounts
    is_approved?: boolean,
    reason?: string,
    time_created?: string,
    time_updated?: string,
    time_deleted?: string,
}