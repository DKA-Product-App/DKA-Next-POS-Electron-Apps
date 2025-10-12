import {BrowserWindow} from "electron";
import Accounts from "./api.account.api";
import AccountsRoles from "./api.account.role.api";

export function AccountsApi(mainWindow ?: BrowserWindow) {
    Accounts(mainWindow);
    AccountsRoles(mainWindow);
}

export default AccountsApi;