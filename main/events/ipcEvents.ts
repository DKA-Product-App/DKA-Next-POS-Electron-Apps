// main/IpcEvents.ts
import { BrowserWindow, globalShortcut, ipcMain, IpcMainEvent } from 'electron'
import moment from 'moment-timezone'
import log from 'electron-log'

type FnKey = `F${1|2|3|4|5|6|7|8|9|10|11|12}`

export default class IpcEvents {
    private mainWindow?: BrowserWindow
    private timeTimer?: NodeJS.Timeout
    private registered = false

    private onPing?: (event: IpcMainEvent, args: unknown) => void
    private onFunctionKey?: (event: IpcMainEvent, args: unknown) => void

    private lastKeyAt: Record<string, number> = {}
    private keyRepeatGap = 120 // ms (anti auto-repeat)

    // debounce untuk toggle fullscreen (hindari double-trigger)
    private lastFsToggleAt = 0
    private fsToggleGap = 180 // ms

    constructor(mainWindow?: BrowserWindow) {
        this.mainWindow = mainWindow
    }

    setWindow(win?: BrowserWindow) {
        this.mainWindow = win
    }

    /** Kirim aman ke renderer (tanpa EPIPE/console) */
    private send(channel: string, payload: unknown) {
        try {
            const wc = this.mainWindow?.webContents
            if (wc && !wc.isDestroyed()) wc.send(channel, payload)
        } catch (err) {
            log.warn('[ipc send] failed:', channel, err)
        }
    }

    /** Handle sebagian key langsung di main-process */
    private handleKeyInMain(key: string) {
        const win = this.mainWindow
        const wc = win?.webContents
        if (!win || !wc) return

        if (key === 'F7') {
            // Debounce toggle fullscreen agar stabil di Linux/Wayland
            const now = Date.now()
            if (now - this.lastFsToggleAt < this.fsToggleGap) return
            this.lastFsToggleAt = now

            try {
                // Short async tick supaya tidak bentrok dengan event stack yang sama
                setTimeout(() => {
                    try {
                        const next = !win.isFullScreen()
                        win.setFullScreen(next)
                        // Catat state buat debugging
                        log.info(`[fullscreen] set to ${next}`)
                    } catch (e) {
                        log.error('[fullscreen] toggle failed:', e)
                    }
                }, 50)
            } catch (e) {
                log.error('[fullscreen] schedule failed:', e)
            }
        } else if (key === 'F8') {
            try {
                wc.isDevToolsOpened() ? wc.closeDevTools() : wc.openDevTools()
            } catch (e) {
                log.warn('[devtools] toggle failed:', e)
            }
        }
    }

    private registerIpc() {
        // Pastikan tidak double listener
        if (this.onPing) ipcMain.removeListener('ping', this.onPing)
        if (this.onFunctionKey) ipcMain.removeListener('function-key', this.onFunctionKey)

        this.onPing = (event) => {
            try {
                event.sender.send('pong', { status: true, code: 200, msg: 'Pong From Server' })
            } catch (e) {
                log.warn('[ipc pong] failed:', e)
            }
        }
        ipcMain.on('ping', this.onPing)

        this.onFunctionKey = (_event, args) => {
            const key = String(args) as FnKey
            this.handleKeyInMain(key)
        }
        ipcMain.on('function-key', this.onFunctionKey)
    }

    private registerClock() {
        // 100ms cukup halus
        if (this.timeTimer) clearInterval(this.timeTimer)
        this.timeTimer = setInterval(() => {
            const humanize = moment().format('HH:mm:ss:SS')
            this.send('time_sync', { humanize })
        }, 100)
        /**
         * @ts-expect-error Electron's Node Timeout exposes unref
         */
        this.timeTimer?.unref?.()
    }

    private registerShortcuts() {
        try {
            globalShortcut.unregisterAll()
        } catch (e) {
            log.warn('[globalShortcut] unregisterAll failed:', e)
        }

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
            if (!ok) log.warn('[globalShortcut] gagal register:', key)
        })
    }

    /** Fokus-only hook: cegah default chromium dan broadcast.
     *  Catatan: **F7 DISKIP** di sini supaya tidak double dengan globalShortcut.
     */
    private wireFKeysFocusOnly() {
        const wc = this.mainWindow?.webContents
        if (!wc) return

        wc.on('before-input-event', (event, input) => {
            if (input.type !== 'keyDown') return
            const k = input.key?.toUpperCase?.()
            if (!k || !/^F(1[0-2]?|[1-9])$/.test(k)) return

            // Block default DevTools di Windows
            if (k === 'F12') event.preventDefault()

            // Hindari double-trigger: F7 hanya via globalShortcut
            if (k === 'F7') return

            this.handleKeyInMain(k)
            this.send('function-key', k)
        })
    }

    async register() {
        if (this.registered) return
        this.registerIpc()
        this.registerClock()
        this.registerShortcuts()   // global (jalan walau window blur)
        this.wireFKeysFocusOnly()  // fokus-only (skip F7), penting untuk F12
        this.registered = true
        log.info('[ipc] registered')
    }

    async unregister() {
        this.registered = false

        if (this.timeTimer) clearInterval(this.timeTimer)
        this.timeTimer = undefined

        if (this.onPing) ipcMain.removeListener('ping', this.onPing)
        if (this.onFunctionKey) ipcMain.removeListener('function-key', this.onFunctionKey)
        this.onPing = undefined
        this.onFunctionKey = undefined

        try {
            globalShortcut.unregisterAll()
        } catch (e) {
            log.warn('[globalShortcut] unregisterAll failed:', e)
        }

        log.info('[ipc] unregistered')
    }
}
