// events/pong.event.ts
import { ipcMain, IpcMainEvent } from 'electron'
import log from 'electron-log'

export class PongEvent {
    private onPing?: (event: IpcMainEvent) => void

    register() {
        if (this.onPing) ipcMain.removeListener('ping', this.onPing)
        this.onPing = (event) => event.sender.send('pong', { status: true, code: 200, msg: 'Pong From Server' })
        ipcMain.on('ping', this.onPing)
        log.info('[pong.event] registered')
    }

    unregister() {
        if (this.onPing) ipcMain.removeListener('ping', this.onPing)
        this.onPing = undefined
        log.info('[pong.event] unregistered')
    }
}
