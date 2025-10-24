import {API, ELECTRON, FUNCTION_KEY, IPC, IO } from '../main/preload'

declare global {
  interface Window {
    ipc: IPC,
    shortcut : FUNCTION_KEY,
    api : API,
    io : IO,
    electron : ELECTRON
  }
}
