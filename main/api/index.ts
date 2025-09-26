import {BrowserWindow} from "electron";
import Config from "./config";
import {ProductApi} from "./product";
import TransactionApi from "./transaction";
import Auth from "./auth";


export function Api(mainWindow ?: BrowserWindow) {
    Auth(mainWindow);
    Config(mainWindow);
    ProductApi(mainWindow);
    TransactionApi(mainWindow);
}

export default Api;