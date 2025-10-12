import {BrowserWindow} from "electron";
import Config from "./config";
import {ProductApi} from "./product";
import TransactionApi from "./transaction";
import Auth from "./auth";
import AccountsApi from "./account";


export function Api(mainWindow ?: BrowserWindow) {
    Auth(mainWindow);
    AccountsApi(mainWindow);
    Config(mainWindow);
    ProductApi(mainWindow);
    TransactionApi(mainWindow);
}

export default Api;