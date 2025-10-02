import {BrowserWindow} from "electron";
import KeyEvent from "./key";
import TimeEvent from "./time";


export function Event(mainWindow?: BrowserWindow) {
    KeyEvent(mainWindow);
    TimeEvent();
}

export default Event;