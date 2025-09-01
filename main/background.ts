import path from 'path'
import { app, ipcMain, Menu, screen } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

const isProd = process.env.NODE_ENV === 'production'

// --- Variable faktor skala (ubah sesuka hati: 0.5, 1, 1.5, 2, dll)
const scaleFactor = 0.8

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  // Ambil resolusi layar utama
  const { workArea } = screen.getPrimaryDisplay()
  const width = Math.floor(workArea.width * scaleFactor)
  const height = Math.floor(workArea.height * scaleFactor)

  // Biar tetap center
  const x = Math.floor(workArea.x + (workArea.width - width) / 2)
  const y = Math.floor(workArea.y + (workArea.height - height) / 2)

  const mainWindow = createWindow('main', {
    width,
    height,
    x,
    y,
    maximizable: true,
    minimizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://.')
    Menu.setApplicationMenu(null)
    mainWindow.maximize();
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}`)
    Menu.setApplicationMenu(null)
    // mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
