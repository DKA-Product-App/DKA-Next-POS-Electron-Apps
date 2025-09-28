import {BrowserWindow} from "electron";
import Base from "./base";
import Data from "./data";
import Device from "./device";


export function Config(mainWindow ?: BrowserWindow) {
    Base(mainWindow);
    Data(mainWindow);
    Device(mainWindow);
}

export default Config;