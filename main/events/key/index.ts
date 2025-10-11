// main/key-event.ts
import { app, globalShortcut, BrowserWindow, ipcMain } from 'electron';

const FN_KEYS = Array.from({ length: 12 }, (_, i) => `F${i + 1}` as const);
type FnKey = typeof FN_KEYS[number];

const CHANNEL = 'shortcut';

export function KeyEvent(mainWindow?: BrowserWindow) {
    let registered = false;

    const broadcast = (key: string, origin: 'global' | 'before-input') =>
        BrowserWindow.getAllWindows().forEach(w =>
            w.webContents.send(CHANNEL, { key, origin })
        );

    // --- NEW: normalizer untuk key|code (fix F12 di Windows) ---
    const resolveFnKey = (input: any): FnKey | undefined => {
        const k = String(input?.key ?? '').toUpperCase();
        const c = String(input?.code ?? '').toUpperCase();
        const hit = (FN_KEYS as readonly string[]).find(fn => fn === k || fn === c);
        return hit as FnKey | undefined;
    };

    const registerGlobals = () => {
        if (registered || !app.isReady()) return false;
        customEventsDefaults(mainWindow);
        registered = FN_KEYS
            .map(k => globalShortcut.register(k, () => broadcast(k, 'global')))
            .every(Boolean);
        return registered;
    };

    const unregisterGlobals = () => {
        globalShortcut.unregisterAll();
        ipcMain.removeAllListeners('key.window.fullscreen');
        ipcMain.removeAllListeners('key.window.dev.mode');
        registered = false;
    };

    // Blok default Chromium (F5/F11/F12, Ctrl/Cmd+R/I, F10) → teruskan ke renderer
    const preventBrowserDefaults = (win: BrowserWindow) =>
        win.webContents.on('before-input-event', (event, input) => {
            const fn = resolveFnKey(input);                                // ← baca dari key ATAU code
            const keyUp = String(input?.key ?? '').toUpperCase();

            const isReload = keyUp === 'F5' || (keyUp === 'R' && (input.control || input.meta));
            const isHardReload = keyUp === 'R' && (input.control || input.meta) && input.shift;
            const isFullscreen = keyUp === 'F11';
            const isDevtoolsAccel = (keyUp === 'I' && (input.control || input.meta) && input.shift) || keyUp === 'F12';
            const isMenuFocus = keyUp === 'F10';

            const shouldBlock = Boolean(fn) || isReload || isHardReload || isFullscreen || isDevtoolsAccel || isMenuFocus;

            // Gunakan nama FN ter-normalisasi saat broadcast (mis. 'F12')
            shouldBlock ? (event.preventDefault(), broadcast(fn ?? keyUp, 'before-input')) : null;
        });

    const customEventsDefaults = (win: BrowserWindow) => {
        ipcMain.on('key.window.fullscreen', (event) => {
            if (event.sender.id !== win.webContents.id) return;
            win.setFullScreen(!win.isFullScreen());
        });
        ipcMain.on('key.window.dev.mode', (event) => {
            if (event.sender.id !== win.webContents.id) return;
            (!win.webContents.isDevToolsOpened()) ? win.webContents.openDevTools() : win?.webContents?.closeDevTools();
        });
    };

    app.on('browser-window-created', (_e, win) => {
        preventBrowserDefaults(win);
    });
    app.on('browser-window-focus', registerGlobals);
    app.on('browser-window-blur', unregisterGlobals);
    app.on('will-quit', unregisterGlobals);
}

export default KeyEvent;
