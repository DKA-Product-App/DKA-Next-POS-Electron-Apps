import {BrowserWindow} from "electron";
import Config from "./config";
import {ProductApi} from "./product";


export function Api(mainWindow ?: BrowserWindow) {
    Config(mainWindow);
    ProductApi(mainWindow);
}

export default Api;