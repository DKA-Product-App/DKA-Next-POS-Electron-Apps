import {app, BrowserWindow} from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
  await app.whenReady()
      .then(async (ready) => {
        await mainWindow();
      })
      .catch((error) => {
        app.quit();
      })
})();

app.on('window-all-closed', () => {
  app.quit()
})