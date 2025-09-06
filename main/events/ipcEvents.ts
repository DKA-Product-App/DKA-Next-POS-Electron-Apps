import {BrowserWindow, globalShortcut, ipcMain} from "electron";
import moment from "moment-timezone";


export default class IpcEvents {

    private mainWindow : BrowserWindow | undefined = undefined;
    private TimeNow : NodeJS.Timeout | undefined = undefined;

    constructor(mainWindow : BrowserWindow | undefined) {
        this.mainWindow = mainWindow
    }

    async register() {
        //#####################################################################################################
        ipcMain.on('ping', (event, args) => {
            console.log({ status : true, code : 200, msg : `ping from renderer`});
            event.sender.send('pong', { status : true, code : 200, msg : `Pong From Server`});
        });
        //#####################################################################################################
        this.TimeNow = setInterval(() => {
            try {
                const timeNow = moment(moment.now());
                if (this.mainWindow !== undefined && this.mainWindow.webContents !== undefined){
                    this.mainWindow?.webContents?.send('time_sync', {
                        humanize : timeNow.format('HH:mm:ss:SS')
                    })
                }
            }catch (e) {}

        }, 10)
        //#####################################################################################################
        ipcMain.on("function-key", (event, args) => {
            switch (args) {
                case "F7" :
                    if (!this.mainWindow.fullScreen) {
                        this.mainWindow.setFullScreen(true);
                    }else{
                        this.mainWindow.setFullScreen(false);
                    }
                    break;
                case "F8" :
                    if (!this.mainWindow.webContents.isDevToolsOpened()){
                        this.mainWindow.webContents.openDevTools()
                    }else{
                        this.mainWindow.webContents.closeDevTools()
                    }
                    break;
            }
        })

        Array.from({ length: 12 }, (_, i) => i + 1).forEach((n) => {
            const key = `F${n}`;
            globalShortcut.register(key, () => {
                try {
                    this.mainWindow?.webContents.send("function-key", key);
                }catch (e) {}

            });
        });
    }

    async unregister() {
        clearInterval(this.TimeNow);
        globalShortcut.unregisterAll();
    }
}