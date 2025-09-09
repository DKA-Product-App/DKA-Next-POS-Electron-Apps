import { app } from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";
import { registerDataProtocol } from "./functions";



(async () => {
    const isProd = process.env.NODE_ENV === 'production'
    app.on('ready', async () => {
        console.log('app activated ');
        if (isProd) {
            serve({directory: 'app'})
        } else {
            app.setPath('userData', `${app.getPath('userData')} (development)`)
        }
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