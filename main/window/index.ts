import path from 'path'
import {app, ipcMain, Menu, screen} from 'electron'
import { createWindow } from '../functions';
import Api from '../api';
import Event from "../events";

const isProd = process.env.NODE_ENV === 'production'

const pickZoom = (wLogical: number) =>
    wLogical > 1920 ? 1.00 :          // hanya kalau lebih besar dari 1920
        wLogical >= 1600 ? 0.95 :
            wLogical >= 1440 ? 0.90 :
                wLogical >= 1366 ? 0.85 :
                    wLogical >= 1280 ? 0.80 :
                        wLogical >= 1152 ? 0.75 :
                            wLogical >= 1024 ? 0.70 : 0.65

export default async function MainWindow(){
    //#######################################################
    const mainWindow = createWindow('main', {
        maximizable: true,
        minimizable: true,
        autoHideMenuBar: isProd,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    //#######################################################
    Event();
    //#######################################################
    mainWindow
        .on('show', () => {

            // ambil display tempat window muncul
            const display = screen.getDisplayMatching(mainWindow.getBounds())
            const sf = display.scaleFactor || 1
            const wLogical = Math.round(display.workAreaSize.width / sf)

            const factor = pickZoom(wLogical)
            mainWindow.webContents.setZoomFactor(factor)
        })
        .on('close', () => {
            console.log('window is closed')
        });
    //#######################################################
    mainWindow.webContents
        .on('did-finish-load', () => {
            mainWindow.show();
            Api(mainWindow);

        }).on('destroyed', () => {

        })
    //#######################################################
    app.on('quit', () => {

    });
    if (isProd) {
        await mainWindow.loadURL('app://-/auth'); // <- wajib trailing slash
        Menu.setApplicationMenu(null);
        mainWindow.maximize();
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/auth`); // <- slash

    }
}