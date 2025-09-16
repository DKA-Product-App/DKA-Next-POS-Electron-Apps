import { app } from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";
import { registerDataProtocol } from "./functions";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
    serve({directory: 'app'})
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        app.quit()
        process.exit(0)
    }
    app.on('ready', async () => {
        console.log('app activated ');
    });
    app.whenReady()
        .then(() => {
            return Promise.all([
                registerDataProtocol(),
                mainWindow()
            ])
        }).catch(() => {
            app.quit();
        });

})();

app.on('window-all-closed', () => {
    app.quit()
})