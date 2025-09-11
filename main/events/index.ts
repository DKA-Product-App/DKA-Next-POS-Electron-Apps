// main/IpcEvents.ts (index)
import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron'
import log from 'electron-log'
import { KeyEvent, PongEvent, TimeEvent, ThemeEvent } from './components'

type SendFn = (channel: string, payload: unknown) => void

export default class IpcEvents {
    private mainWindow?: BrowserWindow
    private registered = false

    private keyEvent?: KeyEvent
    private pongEvent?: PongEvent
    private timeEvent?: TimeEvent
    private themeEvent?: ThemeEvent

    constructor(mainWindow?: BrowserWindow) {
        this.mainWindow = mainWindow
    }

    setWindow(win?: BrowserWindow) {
        this.mainWindow = win
        this.keyEvent?.setWindow?.(win)
    }

    private send: SendFn = (channel, payload) => {
        const wc = this.mainWindow?.webContents
        if (wc && !wc.isDestroyed()) wc.send(channel, payload)
    }

    private onFunctionKey?: (event: IpcMainEvent, args: unknown) => void

    async register() {
        if (this.registered) return

        this.keyEvent = new KeyEvent(this.mainWindow, this.send)
        this.pongEvent = new PongEvent()
        this.timeEvent = new TimeEvent(this.send)
        this.themeEvent = new ThemeEvent(this.send)

        this.keyEvent.register()
        this.pongEvent.register()
        this.timeEvent.register(100)
        await this.themeEvent.register()

        if (this.onFunctionKey) ipcMain.removeListener('function-key', this.onFunctionKey)
        this.onFunctionKey = (_e, args) => this.send('function-key', String(args))
        ipcMain.on('function-key', this.onFunctionKey)

        this.registered = true
        log.info('[ipc] registered (index)')
    }

    async unregister() {
        this.registered = false

        if (this.onFunctionKey) ipcMain.removeListener('function-key', this.onFunctionKey)
        this.onFunctionKey = undefined

        this.keyEvent?.unregister()
        this.pongEvent?.unregister()
        this.timeEvent?.unregister()
        await this.themeEvent?.unregister()

        this.keyEvent = undefined
        this.pongEvent = undefined
        this.timeEvent = undefined
        this.themeEvent = undefined

        log.info('[ipc] unregistered (index)')
    }
}