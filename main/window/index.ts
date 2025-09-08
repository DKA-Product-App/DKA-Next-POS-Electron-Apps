import path from 'path'
import {app, Menu, screen} from 'electron'
import { createWindow } from '../helpers'
import IpcEvents from "../events/ipcEvents";
import {Connector} from "../database/connector";
import {Services} from "../services";

const isProd = process.env.NODE_ENV === 'production'
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

    const mainWindow = createWindow('main', {
        width, height, x, y,
        maximizable: true,
        minimizable: true,
        show : false,
        //autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    const ipcEvents = new IpcEvents(mainWindow);

    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
        Services.OrganizationRepository.create({ name : 'PT. DKA Research Center'}).then((r) => {
            console.log(r);
        })
    });

    mainWindow.webContents.on('did-finish-load', () => {
        ipcEvents.register();
    });

    app.on('quit', () => {
        ipcEvents.unregister();
    });

    mainWindow.webContents.on('destroyed', () => {
        ipcEvents.unregister();
    })

    if (isProd) {
        await mainWindow.loadURL('app://-/cashier'); // <- wajib trailing slash
        Menu.setApplicationMenu(null);
        mainWindow.maximize();
    } else {
        const port = process.argv[2];
        await mainWindow.loadURL(`http://localhost:${port}/cashier`); // <- slash
        Menu.setApplicationMenu(null);
    }
}