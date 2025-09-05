import {app, BrowserWindow, protocol} from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";
import {registerDataProtocol} from "./helpers/protocols";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
      await app.whenReady()
          .then(async () => {
              await registerDataProtocol()
              await mainWindow();
          })
          .catch(() => {
            app.quit();
          })
})();

app.on('window-all-closed', () => {
  app.quit()
})