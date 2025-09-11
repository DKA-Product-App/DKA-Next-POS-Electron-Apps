// events/theme.event.ts
import { ipcMain, IpcMainEvent } from 'electron'
import { ConfigRepository } from '../../repositories/config'

export type ThemeMode = 'dark' | 'light'
type SendFn = (channel: string, payload: unknown) => void

export class ThemeEvent {
    private send: SendFn
    private repo: ConfigRepository
    private unbinds: Array<() => void> = []

    constructor(send: SendFn, repo?: ConfigRepository) {
        this.send = send
        this.repo = repo ?? new ConfigRepository()
    }

    private ensure = async () => {
        // hanya set default sekali; tidak override nilai existing
        await this.repo.setDefault('theme', 'light')
    }

    private getTheme = async (): Promise<ThemeMode> => {
        const val = await this.repo.get('theme')
        return val === 'dark' ? 'dark' : 'light'
    }

    private setTheme = async (mode: ThemeMode) => {
        await this.repo.set('theme', mode)
        this.send('theme:changed', { mode }) // broadcast ke semua renderer
        return mode
    }

    private toggleTheme = async () => {
        const curr = await this.getTheme()
        const next: ThemeMode = curr === 'dark' ? 'light' : 'dark'
        await this.setTheme(next)
        return next
    }

    register = async () => {
        await this.ensure()

        // === theme:get (request → reply ke pengirim) ===
        const hGet = async (event: IpcMainEvent) => {
            const mode = await this.getTheme()
            event.sender.send('theme:resp', { mode }) // reply khusus ke sender
        }
        ipcMain.on('theme:get', hGet)
        this.unbinds.push(() => ipcMain.removeListener('theme:get', hGet))

        // === theme:set (set lalu broadcast theme:changed) ===
        const hSet = async (_e: IpcMainEvent, mode: ThemeMode) => {
            await this.setTheme(mode)
        }
        ipcMain.on('theme:set', hSet)
        this.unbinds.push(() => ipcMain.removeListener('theme:set', hSet))

        // === theme:toggle (toggle lalu broadcast) ===
        const hToggle = async () => { await this.toggleTheme() }
        ipcMain.on('theme:toggle', hToggle)
        this.unbinds.push(() => ipcMain.removeListener('theme:toggle', hToggle))

        // Broadcast state awal (opsional)
        const mode = await this.getTheme()
        this.send('theme:changed', { mode })
    }

    unregister = async () => {
        this.unbinds.forEach(fn => fn())
        this.unbinds = []
        await this.repo.close()
    }
}
