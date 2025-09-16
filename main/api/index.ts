import {BrowserWindow} from "electron";
import Config from "./config";
import {ProductApi} from "./product";
import TransactionApi from "./transaction";


export function Api(mainWindow ?: BrowserWindow) {
    Config(mainWindow);
    ProductApi(mainWindow);
    TransactionApi(mainWindow)
}

export default Api;