import {BrowserWindow} from "electron";
import KeyEvent from "./key";
import TimeEvent from "./time";


export function Event() {
    KeyEvent();
    TimeEvent();
}

export default Event;