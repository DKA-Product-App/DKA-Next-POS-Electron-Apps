import {BrowserWindow} from "electron";
import Base from "./base";
import Data from "./data";


export function Config(mainWindow ?: BrowserWindow) {
    Base(mainWindow);
    Data(mainWindow);
}

export default Config;