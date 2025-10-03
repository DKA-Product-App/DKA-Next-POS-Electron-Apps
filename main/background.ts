import { app } from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";
import log from 'electron-log'
import { registerDataProtocol } from "./functions";

const isProd = process.env.NODE_ENV === 'production'

// Naikkan heap V8 utk SEMUA proses (main & renderer)
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096 --initial-old-space-size=1024');

if (isProd) {
    serve({directory: 'app'})
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`)
}
// 1) Matikan console transport jika tidak ada TTY (production Linux GUI)
if (!process.stdout || !process.stdout.isTTY) {
    log.transports.console.level = false
    // opsional: bungkam console bawaan juga
    console.log = () => {}
    console.info = () => {}
    console.warn = () => {}
    // arahkan error ke file (biar tetap ada jejak)
    const e = (...args: any[]) => log.error(...args)
    // @ts-ignore
    console.error = e
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
                mainWindow()
            ])
        }).catch(() => {
            app.quit();
        });

})();

app.on('window-all-closed', () => {
    app.quit()
})