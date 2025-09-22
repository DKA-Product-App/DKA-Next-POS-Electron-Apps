import {BrowserWindow} from "electron";
import {TransactionBills} from "./api.transaction.bills.api";

export function TransactionBillsApi(mainWindow ?: BrowserWindow) {
    TransactionBills(mainWindow);
}

export default TransactionBillsApi;