import path from 'path'
import {app, BrowserWindow, globalShortcut, ipcMain, Menu, screen} from 'electron'
import { createWindow } from '../helpers'
import moment from "moment-timezone";


const isProd = process.env.NODE_ENV === 'production'
let mainWindow : BrowserWindow | undefined = undefined;
// --- Variable faktor skala (ubah sesuka hati: 0.5, 1, 1.5, 2, dll)
const scaleFactor = 0.8
let TimeNow : NodeJS.Timeout | undefined = undefined;

export default async function MainWindow(){
    // Ambil resolusi layar utama
    const { workArea } = screen.getPrimaryDisplay()
    const width = Math.floor(workArea.width * scaleFactor)
    const height = Math.floor(workArea.height * scaleFactor)

    // Biar tetap center
    const x = Math.floor(workArea.x + (workArea.width - width) / 2)
    const y = Math.floor(workArea.y + (workArea.height - height) / 2)

    mainWindow = createWindow('main', {
        width, height, x, y,
        maximizable: true,
        minimizable: true,
        show : false,
        //autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log("Renderer sudah selesai load, siap terima IPC");
        //#####################################################################################################
        ipcMain.on('ping', (event, args) => {
            console.log({ status : true, code : 200, msg : `ping from renderer`});
            event.sender.send('pong', { status : true, code : 200, msg : `Pong From Server`});
        });
        //#####################################################################################################
        TimeNow = setInterval(() => {
            const timeNow = moment(moment.now());
            if (mainWindow !== undefined && mainWindow.webContents !== undefined){
                mainWindow?.webContents?.send('time_sync', {
                    humanize : timeNow.format('HH:mm:ss:SS')
                })
            }
        }, 10)

        ipcMain.on("function-key", (event, args) => {
            switch (args) {
                case "F7" :
                    if (!mainWindow.fullScreen) {
                        mainWindow.setFullScreen(true);
                    }else{
                        mainWindow.setFullScreen(false);
                    }
                    break;
                case "F8" :
                    if (!mainWindow.webContents.isDevToolsOpened()){
                        mainWindow.webContents.openDevTools()
                    }else{
                        mainWindow.webContents.closeDevTools()
                    }
                    break;
            }
        })
        // Register semua F1–F12
        Array.from({ length: 12 }, (_, i) => i + 1).forEach((n) => {
            const key = `F${n}`;
            globalShortcut.register(key, () => {
                mainWindow?.webContents.send("function-key", key);
            });
        });


    });

    app.on('quit', () => {
        clearInterval(TimeNow);
        globalShortcut.unregisterAll();
    });

    mainWindow.webContents.on('destroyed', () => {
        clearInterval(TimeNow);
        globalShortcut.unregisterAll();
    })

    if (isProd) {
        await mainWindow.loadURL('app://-/cashier/'); // <- wajib trailing slash
        Menu.setApplicationMenu(null);
        mainWindow.maximize();
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/cashier/`); // <- slash
        Menu.setApplicationMenu(null);
    }
}