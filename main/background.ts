import { app } from 'electron'
import serve from 'electron-serve'
import mainWindow from "./window";
import { registerDataProtocol } from "./functions";
import { Printer } from "@dkaframework/iot";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
    serve({directory: 'app'})
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
    const printer = new Printer.Escpos({
        state : isProd ? "PRODUCTION" : "DEVELOPMENT",
        connection : Printer.Escpos.Options.CONNECTION.ESCPOS_USB,
        autoDetectUSB : true
    });
    app.on('ready', async () => {
        console.log('app activated ');
        printer.CheckStatus()
            .then((status) => {
                console.log(status)
            })
            .catch((error) => {
                console.error(error)
            })
    });
    app.whenReady()
        .then(() => {
            return Promise.all([
                registerDataProtocol(),
                mainWindow()
            ])
        }).catch(() => {
            //app.quit();
        });

})();

app.on('window-all-closed', () => {
    app.quit()
})