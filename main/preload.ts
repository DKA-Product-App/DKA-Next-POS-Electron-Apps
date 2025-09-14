import { contextBridge, ipcRenderer, IpcRendererEvent, app } from 'electron';
import { version } from "./../package.json";
import {AxiosRequestConfig, AxiosResponse} from "axios";

const electronVersion = process.versions.electron
const chromeVersion = process.versions.chrome
const nodeVersion = process.versions.node
const isProd = process.env.NODE_ENV === 'production'


const IPC = {
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
  revoke(channel: string) {
    ipcRenderer.removeAllListeners(channel)
  },
}

const FUNCTION_KEY = {
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
  revoke(channel: string) {
    ipcRenderer.removeAllListeners(channel)
  },
}

const API = {
  invoke<Request = any, Response = any>(channel: string, args: Request): Promise<Response> {
    return ipcRenderer.invoke(channel, args);
  },
}

const ELECTRON = {
  versions: {
    app: version,
    dev : !isProd,
    electron: electronVersion,
    chrome: chromeVersion,
    node: nodeVersion,
  }
}


contextBridge.exposeInMainWorld('ipc', IPC)
contextBridge.exposeInMainWorld('function-key', FUNCTION_KEY)
contextBridge.exposeInMainWorld('api', API);
contextBridge.exposeInMainWorld('electron', ELECTRON)

export type IPC = typeof IPC;
export type FUNCTION_KEY = typeof FUNCTION_KEY;
export type API = typeof API;
export type ELECTRON = typeof ELECTRON;
