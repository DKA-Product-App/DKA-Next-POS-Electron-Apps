import {BrowserWindow} from "electron";
import ApiConfigBaseCorporation from "./api.config.base.corporation.api";


export function Base(mainWindow ?: BrowserWindow) {
    ApiConfigBaseCorporation(mainWindow)
}

export default Base;