import {BrowserWindow} from "electron";
import ApiConfigDataOrderType from "./api.config.data.order.type.api";
import ApiConfigDataFloorsTables from "./api.config.data.floors.tables.api";


export function Data(mainWindow ?: BrowserWindow) {
    ApiConfigDataOrderType(mainWindow)
    ApiConfigDataFloorsTables(mainWindow)
}

export default Data;