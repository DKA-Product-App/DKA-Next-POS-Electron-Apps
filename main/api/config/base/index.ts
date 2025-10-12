import {BrowserWindow} from "electron";
import ApiConfigBaseCorporation from "./api.config.base.corporation.api";
import ApiConfigBaseBranch from "./api.config.base.branch.api";


export function Base(mainWindow ?: BrowserWindow) {
    ApiConfigBaseCorporation(mainWindow);
    ApiConfigBaseBranch(mainWindow);
}

export default Base;