import { screen, BrowserWindow, BrowserWindowConstructorOptions, Rectangle } from 'electron'
import Store from 'electron-store'

type WindowState = Rectangle & {
  isMaximized?: boolean | null
  isFullScreen?: boolean | null
  displayId?: number | null
}

export const createWindow = (
    windowName: string,
    options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const KEY = 'window-state'
  const name = `window-state-${windowName}`

  const store = new Store<WindowState>({
    name,
    schema: {
      x: { type: 'number' },
      y: { type: 'number' },
      width: { type: 'number' },
      height: { type: 'number' },
      isMaximized: { type: ['boolean', 'null'], default: false },
      isFullScreen: { type: ['boolean', 'null'], default: false },
      displayId: { type: ['number', 'null'], default: null },
    },
  })

  const scale = 0.8
  const primary = screen.getPrimaryDisplay()
  const work = primary.workArea

  const defaultWidth = Math.floor(work.width * scale)
  const defaultHeight = Math.floor(work.height * scale)
  const defaultX = Math.floor(work.x + (work.width - defaultWidth) / 2)
  const defaultY = Math.floor(work.y + (work.height - defaultHeight) / 2)

  const defaultState: WindowState = {
    x: defaultX,
    y: defaultY,
    width: options.width ?? defaultWidth,
    height: options.height ?? defaultHeight,
    isMaximized: false,
    isFullScreen: false,
    displayId: primary.id,
  }

  const within = (s: WindowState, b: Rectangle) =>
      s.x >= b.x &&
      s.y >= b.y &&
      s.x + s.width <= b.x + b.width &&
      s.y + s.height <= b.y + b.height

  const centerIn = (b: Rectangle) => ({
    x: Math.floor(b.x + (b.width - (defaultState.width ?? 800)) / 2),
    y: Math.floor(b.y + (b.height - (defaultState.height ?? 600)) / 2),
  })

  const restore = (): WindowState => {
    const saved = store.get(KEY, defaultState)
    const displays = screen.getAllDisplays()
    const target =
        (typeof saved.displayId === 'number' &&
            displays.find(d => d.id === saved.displayId)) ||
        screen.getDisplayMatching(saved) ||
        primary

    const safe = within(saved, target.bounds)
        ? saved
        : { ...saved, ...centerIn(target.bounds), displayId: target.id }

    const minW = Math.max(options.minWidth ?? 300, 300)
    const minH = Math.max(options.minHeight ?? 200, 200)
    return {
      ...safe,
      width: Math.max(safe.width, minW),
      height: Math.max(safe.height, minH),
      isMaximized: !!safe.isMaximized,
      isFullScreen: !!safe.isFullScreen,
    }
  }

  let state = restore()

  const win = new BrowserWindow({
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
  })

  const snapshot = (): WindowState => {
    if (!win || win.isDestroyed()) return store.get(KEY, defaultState)

    const [x, y] = win.getPosition()
    const [width, height] = win.getSize()
    const bounds: Rectangle = { x, y, width, height }
    const display = screen.getDisplayMatching(bounds) || primary
    return {
      ...bounds,
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
      displayId: display.id,
    }
  }

  let t: NodeJS.Timeout | undefined
  const queueSave = () => {
    if (!win || win.isDestroyed()) return
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      if (!win || win.isDestroyed()) return
      const latest = snapshot()
      const prev = store.get(KEY, defaultState)
      const toSave =
          latest.isMaximized || latest.isFullScreen
              ? { ...prev, ...latest }
              : latest
      store.set(KEY, toSave)
    }, 150)
  }

  win.on('move', queueSave)
  win.on('resize', queueSave)
  win.on('maximize', queueSave)
  win.on('unmaximize', queueSave)
  win.on('enter-full-screen', queueSave)
  win.on('leave-full-screen', queueSave)
  win.on('close', queueSave)

  const saved = store.get(KEY, defaultState)
  if (saved.isFullScreen) win.setFullScreen(true)
  else if (saved.isMaximized) win.maximize()

  return win
}
