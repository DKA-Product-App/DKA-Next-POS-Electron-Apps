import {BrowserWindow} from "electron";
import ApiConfigDevicePrinter from "./api.config.device.printer.api";


export function Device(mainWindow ?: BrowserWindow) {
    ApiConfigDevicePrinter(mainWindow)
}

export default Device;