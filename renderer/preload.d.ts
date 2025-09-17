import {API, ELECTRON, FUNCTION_KEY, IPC} from '../main/preload'

declare global {
  interface Window {
    ipc: IPC,
    shortcut : FUNCTION_KEY,
    api : API,
    electron : ELECTRON
  }
}
