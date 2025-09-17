// events/time.event.ts
import { app, BrowserWindow } from 'electron'
import moment from 'moment-timezone'
import log from 'electron-log'

type NodeTimeout = ReturnType<typeof setInterval>

export function TimeEvent(intervalMs = 100) {
    let timer: NodeTimeout | undefined
    let running = false

    const tick = () => {
        const humanize = moment().format('HH:mm:ss:SS')
        BrowserWindow.getAllWindows()
            .forEach(w => w.webContents.send('time_sync', { humanize }))
    }

    const start = () => {
        if (running || !app.isReady()) return false
        timer = setInterval(tick, intervalMs)
        ;(timer as unknown as { unref?: () => void })?.unref?.()
        running = true
        log.info('[time.event] registered')
        return true
    }

    const stop = () => {
        timer ? clearInterval(timer) : undefined
        timer = undefined
        running ? log.info('[time.event] unregistered') : undefined
        running = false
    }
    // Mulai segera saat app siap; kalau dipanggil sebelum ready, tunggu.
    app.isReady() ? start() : app.once('ready', start)
    // Window baru: pastikan timer hidup & kirim 1x setelah load agar UI langsung sinkron.
    app.on('browser-window-created', (_e, win) => {
        if (!running) start();
        win.webContents.once('did-finish-load', () => tick())
    })

    // Berhenti hanya saat SEMUA window sudah tertutup (hemat CPU saat idle/macOS style).
    app.on('window-all-closed', stop)

    // Bersih total saat app mau quit.
    app.on('will-quit', stop)
}

export default TimeEvent
