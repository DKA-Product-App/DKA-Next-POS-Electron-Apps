import { contextBridge, ipcRenderer, IpcRendererEvent, app } from 'electron';
import { version } from "./../package.json";

const electronVersion = process.versions.electron
const chromeVersion = process.versions.chrome
const nodeVersion = process.versions.node
const isProd = process.env.NODE_ENV === 'production'

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value)
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback( ...args)
    ipcRenderer.on(channel, subscription)

    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
}

contextBridge.exposeInMainWorld('ipc', handler)
contextBridge.exposeInMainWorld('function-key', handler)
contextBridge.exposeInMainWorld('electron', {
  versions: {
    app: version,
    dev : !isProd,
    electron: electronVersion,
    chrome: chromeVersion,
    node: nodeVersion,
  }
})



export type IpcHandler = typeof handler
