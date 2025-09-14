import {API, ELECTRON, FUNCTION_KEY, IPC} from '../main/preload'

declare global {
  interface Window {
    ipc: IPC,
    'function-key' : FUNCTION_KEY,
    api : API,
    electron : ELECTRON
  }
}
