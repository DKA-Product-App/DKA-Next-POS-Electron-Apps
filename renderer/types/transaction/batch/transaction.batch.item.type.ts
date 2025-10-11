import {TransactionBatchItemVoid} from "./transaction.batch.item.void.type";
import {ProductsVariants} from "../../product/products.variants.type";
import {Products} from "../../product/products.type";
import {Accounts} from "../../account/accounts.type";
import {TransactionBatch} from "./transaction.batch.type";


export interface TransactionBatchItem {
    id?: string,
    reference?: Accounts,
    batch?: TransactionBatch,
    product?: Products,
    variant?: ProductsVariants,
    qty?: number,
    price?: string | number,
    sub_total?: string | number,
    note?: string,
    time_created?: string,
    time_updated?: string,
    time_deleted?: string,
    void?: TransactionBatchItemVoid
}