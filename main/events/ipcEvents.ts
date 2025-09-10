// main/IpcEvents.ts
import { BrowserWindow, globalShortcut, ipcMain, IpcMainEvent } from 'electron'
import moment from 'moment-timezone'

type FnKey = `F${1|2|3|4|5|6|7|8|9|10|11|12}`

export default class IpcEvents {
    private mainWindow?: BrowserWindow
    private timeTimer?: NodeJS.Timeout
    private registered = false

    private onPing?: (event: IpcMainEvent, args: unknown) => void
    private onFunctionKey?: (event: IpcMainEvent, args: unknown) => void

    private lastKeyAt: Record<string, number> = {}
    private keyRepeatGap = 120 // ms

    constructor(mainWindow?: BrowserWindow) {
        this.mainWindow = mainWindow
    }

    setWindow(win?: BrowserWindow) {
        this.mainWindow = win
    }

    // Util aman kirim ke renderer
    private send(channel: string, payload: unknown) {
        const wc = this.mainWindow?.webContents
        if (wc && !wc.isDestroyed()) wc.send(channel, payload)
    }

    // Handle langsung di main untuk beberapa key
    private handleKeyInMain(key: string) {
        const win = this.mainWindow
        const wc = win?.webContents
        if (!win || !wc) return

        if (key === 'F7') {
            win.setFullScreen(!win.isFullScreen())
        } else if (key === 'F8') {
            wc.isDevToolsOpened() ? wc.closeDevTools() : wc.openDevTools()
        }
    }

    private registerIpc() {
        // Pastikan gak dobel listener
        if (this.onPing) ipcMain.removeListener('ping', this.onPing)
        if (this.onFunctionKey) ipcMain.removeListener('function-key', this.onFunctionKey)

        this.onPing = (event) => {
            event.sender.send('pong', { status: true, code: 200, msg: 'Pong From Server' })
        }
        ipcMain.on('ping', this.onPing)

        this.onFunctionKey = (_event, args) => {
            const key = String(args) as FnKey
            this.handleKeyInMain(key)
        }
        ipcMain.on('function-key', this.onFunctionKey)
    }

    private registerClock() {
        // 100ms cukup halus, gak bikin CPU ngos-ngosan
        if (this.timeTimer) clearInterval(this.timeTimer)
        this.timeTimer = setInterval(() => {
            const humanize = moment().format('HH:mm:ss:SS')
            this.send('time_sync', { humanize })
        }, 100)
        /**
         * @ts-expect-error: Node Timeout di Electron punya unref
         */
        this.timeTimer?.unref?.()
    }

    private registerShortcuts() {
        globalShortcut.unregisterAll()

        const keys: FnKey[] = Array.from({ length: 12 }, (_, i) => `F${i + 1}` as FnKey)
        keys.forEach((key) => {
            const ok = globalShortcut.register(key, () => {
                const now = Date.now()
                const last = this.lastKeyAt[key] ?? 0
                if (now - last < this.keyRepeatGap) return
                this.lastKeyAt[key] = now

                // Tangani sebagian di main (F7/F8), dan broadcast ke renderer
                this.handleKeyInMain(key)
                this.send('function-key', key)
            })
            if (!ok) console.warn('[globalShortcut] gagal register:', key)
        })
    }

    // Fokus-only: cegat F12 biar gak di-hijack Chromium (Windows build)
    private wireFKeysFocusOnly() {
        const wc = this.mainWindow?.webContents
        if (!wc) return

        wc.on('before-input-event', (event, input) => {
            if (input.type !== 'keyDown') return
            const k = input.key?.toUpperCase?.()
            if (!k || !/^F(1[0-2]?|[1-9])$/.test(k)) return

            if (k === 'F12') event.preventDefault() // block default DevTools
            this.handleKeyInMain(k)
            this.send('function-key', k)
        })
    }

    async register() {
        if (this.registered) return
        this.registerIpc()
        this.registerClock()
        this.registerShortcuts()   // global (jalan walau window blur)
        this.wireFKeysFocusOnly()  // fokus-only, penting buat F12 di Windows
        this.registered = true
    }

    async unregister() {
        this.registered = false
        if (this.timeTimer) clearInterval(this.timeTimer)
        this.timeTimer = undefined

        if (this.onPing) ipcMain.removeListener('ping', this.onPing)
        if (this.onFunctionKey) ipcMain.removeListener('function-key', this.onFunctionKey)
        this.onPing = undefined
        this.onFunctionKey = undefined

        globalShortcut.unregisterAll()
    }
}
