// events/key.event.ts
import { BrowserWindow, globalShortcut } from 'electron'
import log from 'electron-log'

export type FnKey = `F${1|2|3|4|5|6|7|8|9|10|11|12}`

type SendFn = (channel: string, payload: unknown) => void

export class KeyEvent {
    private win?: BrowserWindow
    private send!: SendFn
    private lastKeyAt: Record<string, number> = {}
    private keyRepeatGap = 120 // ms
    private lastFsToggleAt = 0
    private fsToggleGap = 180 // ms
    private unbindFocus?: () => void

    constructor(win: BrowserWindow | undefined, send: SendFn) {
        this.win = win
        this.send = send
    }

    setWindow(win?: BrowserWindow) {
        this.win = win
    }

    private handleKeyInMain = (key: string) => {
        const win = this.win
        const wc = win?.webContents
        if (!win || !wc) return

        if (key === 'F7') {
            const now = Date.now()
            if (now - this.lastFsToggleAt < this.fsToggleGap) return
            this.lastFsToggleAt = now
            setTimeout(() => {
                const next = !win.isFullScreen()
                win.setFullScreen(next)
                log.info(`[fullscreen] set to ${next}`)
            }, 50)
        } else if (key === 'F8') {
            wc.isDevToolsOpened() ? wc.closeDevTools() : wc.openDevTools()
        }
    }

    private registerGlobalShortcuts = () => {
        const keys: FnKey[] = Array.from({ length: 12 }, (_, i) => `F${i + 1}` as FnKey)
        globalShortcut.unregisterAll()
        keys.forEach((key) => {
            const ok = globalShortcut.register(key, () => {
                const now = Date.now()
                const last = this.lastKeyAt[key] ?? 0
                if (now - last < this.keyRepeatGap) return
                this.lastKeyAt[key] = now

                this.handleKeyInMain(key)
                this.send('function-key', key)
            })
            if (!ok) log.warn('[globalShortcut] gagal register:', key)
        })
    }

    private wireFocusOnly = () => {
        const wc = this.win?.webContents
        if (!wc) return

        const handler = (_event: Electron.Event, input: Electron.Input) => {
            if (input.type !== 'keyDown') return
            const k = input.key?.toUpperCase?.()
            if (!k || !/^F(1[0-2]?|[1-9])$/.test(k)) return
            if (k === 'F12') _event.preventDefault() // block default DevTools
            if (k === 'F7') return // F7 hanya via globalShortcut

            this.handleKeyInMain(k)
            this.send('function-key', k)
        }

        wc.on('before-input-event', handler)
        this.unbindFocus = () => wc.removeListener('before-input-event', handler)
    }

    register() {
        this.registerGlobalShortcuts()
        this.wireFocusOnly()
        log.info('[key.event] registered')
    }

    unregister() {
        this.unbindFocus?.()
        this.unbindFocus = undefined
        globalShortcut.unregisterAll()
        log.info('[key.event] unregistered')
    }
}
