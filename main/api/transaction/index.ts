import {BrowserWindow} from "electron";
import Transaction from "./api.transaction.api";
import TransactionBatch from "./api.transaction.batch.api";

export function TransactionApi(mainWindow ?: BrowserWindow) {
    Transaction(mainWindow);
    TransactionBatch(mainWindow);
}

export default TransactionApi;