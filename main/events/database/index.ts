import { BrowserWindow, ipcMain } from 'electron';
import { ConfigRepository } from '../../repositories/config';

export function DatabaseEvents(mainWindow?: BrowserWindow) {
    const repo = new ConfigRepository();

    // Initialize with defaults
    ipcMain.handle('database.config:init', async () => {
        try {
            await repo.init({
                is_cashier_overview_god_mode: 'true', // default true
            });
            return { status: true, msg: 'Config initialized' };
        } catch (error) {
            console.error('Failed to init config:', error);
            return { status: false, msg: error.message };
        }
    });

    // Get single config value
    ipcMain.handle('database.config:get', async (_event, key: string) => {
        try {
            const value = await repo.get(key);
            return { status: true, data: value };
        } catch (error) {
            console.error(`Failed to get config ${key}:`, error);
            return { status: false, msg: error.message };
        }
    });

    // Set single config value
    ipcMain.handle('database.config:set', async (_event, { key, value }: { key: string; value: string }) => {
        try {
            await repo.set(key, value);
            return { status: true, msg: 'Config updated' };
        } catch (error) {
            console.error(`Failed to set config ${key}:`, error);
            return { status: false, msg: error.message };
        }
    });

    // Get all config
    ipcMain.handle('database.config:all', async () => {
        try {
            const data = await repo.all();
            return { status: true, data };
        } catch (error) {
            console.error('Failed to get all config:', error);
            return { status: false, msg: error.message };
        }
    });
}

export default DatabaseEvents;
