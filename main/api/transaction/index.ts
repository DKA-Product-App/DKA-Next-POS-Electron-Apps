import {BrowserWindow} from "electron";
import Transaction from "./api.transaction.api";
import TransactionBatch from "./api.transaction.batch.api";
import TransactionBatchItem from "./api.transaction.batch.item.api";

export function TransactionApi(mainWindow ?: BrowserWindow) {
    Transaction(mainWindow);
    TransactionBatch(mainWindow);
    TransactionBatchItem(mainWindow);
}

export default TransactionApi;