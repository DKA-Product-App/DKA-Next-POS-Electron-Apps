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

    // Daftarkan global F1..F12 hanya saat ada window fokus
    const registerGlobals = () => {
        if (registered || !app.isReady()) return false;
        customEventsDefaults(mainWindow);
        registered = FN_KEYS.map(k => globalShortcut.register(k, () => broadcast(k, 'global'))).every(Boolean);
        return registered;
    };

    const unregisterGlobals = () => {
        globalShortcut  .unregisterAll();
        ipcMain.removeAllListeners(`key.window.fullscreen`);
        ipcMain.removeAllListeners('key.window.dev.mode')
        registered = false
    };

    // Blok default Chromium (F5/F11/F12, Ctrl/Cmd+R/I, F10 menu focus) → teruskan ke renderer
    const preventBrowserDefaults = (win: BrowserWindow) =>
        win.webContents.on('before-input-event', (event, input) => {
            const isFn = (FN_KEYS as readonly string[]).includes(input.key as FnKey);
            const isReload = input.key === 'F5' || (input.key === 'R' && (input.control || input.meta));
            const isHardReload = input.key === 'R' && (input.control || input.meta) && input.shift;
            const isFullscreen = input.key === 'F11';
            const isDevtools = input.key === 'I' && (input.control || input.meta) && input.shift;
            const isMenuFocus = input.key === 'F10';
            const shouldBlock = isFn || isReload || isHardReload || isFullscreen || isDevtools || isMenuFocus;

            shouldBlock ? (event.preventDefault(), broadcast(input.key, 'before-input')) : null;
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
