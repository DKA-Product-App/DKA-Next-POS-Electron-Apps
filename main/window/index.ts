import path from 'path'
import {app, Menu, screen} from 'electron'
import { createWindow } from '../functions';
import IpcEvents from "../events/ipcEvents";

const isProd = process.env.NODE_ENV === 'production'

export default async function MainWindow(){
    //#######################################################
    const mainWindow = createWindow('main', {
        maximizable: true,
        minimizable: true,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    //#######################################################
    const ipcEvents = new IpcEvents(mainWindow);
    //#######################################################
    mainWindow
        .on('show', () => {
            Menu.setApplicationMenu(null);
        })
        .on('ready-to-show', () => {
            mainWindow.show();
        })
        .on('close', () => {
            console.log('window is closed')
        });
    //#######################################################
    mainWindow.webContents
        .on('did-finish-load', () => {
            ipcEvents.register();
        }).on('destroyed', () => {
            ipcEvents.unregister();
        })
    //#######################################################
    app.on('quit', () => {
        ipcEvents.unregister();
    });
    if (isProd) {
        await mainWindow.loadURL('app://-/auth'); // <- wajib trailing slash
        mainWindow.maximize();
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/cashier`); // <- slash
    }
}