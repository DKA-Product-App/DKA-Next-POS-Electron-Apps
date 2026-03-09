import {BrowserWindow} from "electron";
import KeyEvent from "./key";
import TimeEvent from "./time";
import DatabaseEvents from "./database";


export function Event(mainWindow?: BrowserWindow) {
    KeyEvent(mainWindow);
    TimeEvent();
    DatabaseEvents(mainWindow);
}

export default Event;