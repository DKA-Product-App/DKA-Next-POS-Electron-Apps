import {BrowserWindow} from "electron";
import ApiConfigDataOrderType from "./api.config.data.order.type.api";
import ApiConfigDataFloorsTables from "./api.config.data.floors.tables.api";
import ApiConfigDataPaymentMethod from "./api.config.data.payment.method.api";
import ApiConfigDataFloors from "./api.config.data.floors.api";


export function Data(mainWindow ?: BrowserWindow) {
    ApiConfigDataOrderType(mainWindow)
    ApiConfigDataFloors(mainWindow);
    ApiConfigDataFloorsTables(mainWindow)
    ApiConfigDataPaymentMethod(mainWindow)
}

export default Data;