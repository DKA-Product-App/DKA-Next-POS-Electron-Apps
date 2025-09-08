import {app, BrowserWindow, protocol} from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";
import {registerDataProtocol} from "./helpers/protocols";
import {Services} from "./services";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
    serve({directory: 'app'})
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
    app.on('ready', () => {
        console.log('app activated ');
        new Services();
    });
    app.whenReady()
        .then(async () => {
            await registerDataProtocol()
            await mainWindow();
        })
        .catch(() => {
            app.quit();
        });


})();

app.on('window-all-closed', () => {
    app.quit()
})