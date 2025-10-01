import {BrowserWindow} from "electron";
import {TransactionBills} from "./api.transaction.bills.api";
import TransactionBillsPaid from "./api.transaction.bills.paid.api";

export function TransactionBillsApi(mainWindow ?: BrowserWindow) {
    TransactionBills(mainWindow);
    TransactionBillsPaid(mainWindow);
}

export default TransactionBillsApi;