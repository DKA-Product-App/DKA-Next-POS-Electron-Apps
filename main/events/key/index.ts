import { app, globalShortcut, BrowserWindow, Menu } from 'electron';



const FN_KEYS = Array.from({ length: 12 }, (_, i) => `F${i + 1}` as const);
type FnKey = typeof FN_KEYS[number];

export function KeyEvent() {
    let registered = false;
    // Daftarkan global shortcuts saat window fokus, lepas saat blur.
    // Ini biar gak "nyolong" F-keys waktu user pindah app lain.
    const registerGlobals = () => {
        if (registered || !app.isReady()) return false;
        registered = FN_KEYS
            .map(k => globalShortcut.register(k, () => {
                BrowserWindow
                    .getAllWindows()
                    .forEach(w => w.webContents.send('shortcut', k));
            }))
            .every(Boolean);
        return registered;
    };
    const unregisterGlobals = () => {
        globalShortcut.unregisterAll();
        registered = false;
    };

    // Pasang pencegah default behavior Chromium di satu window
    const preventBrowserDefaults = (win: BrowserWindow) => {
        win.webContents.on('before-input-event', (event, input) => {
            const isFn = (FN_KEYS as readonly string[]).includes(input.key);
            const isReload = input.key === 'F5' || (input.key === 'R' && (input.control || input.meta));
            const isHardReload = input.key === 'R' && (input.control || input.meta) && input.shift;
            const isFullscreen = input.key === 'F11';
            const isDevtools = input.key === 'I' && (input.control || input.meta) && input.shift;
            const shouldBlock = isFn || isReload || isHardReload || isFullscreen || isDevtools;
            // Blok default & teruskan info kuncinya ke renderer biar bisa kamu handle
            if (shouldBlock){
                event.preventDefault();
                win.webContents.send('shortcut', input.key)
            }
        });
    };

    // Auto pasang ke window mana pun yang dibuat (gak perlu ubah signature mainWindow())
    app.on('browser-window-created', (_e, win) => {
        preventBrowserDefaults(win);
    });

    // Registrasi global saat app window fokus, dan lepas saat blur
    app.on('browser-window-focus', registerGlobals);
    app.on('browser-window-blur', unregisterGlobals);

    // Bersih saat quit
    app.on('will-quit', unregisterGlobals);
}

export default KeyEvent;