'use client';

import { useGodModeProvider } from '../components/(cashier)/context/GodModeProviderContext';
import { useUserConfig } from '../contexts/UserConfigContext';

/** God mode untuk API: hindari `null`; hormati lock overview dari config kasir. */
export function useEffectiveGodMode(): boolean {
    const { godMode } = useGodModeProvider();
    const { config } = useUserConfig();
    if (config.cashier.isOverviewGodModeEnabled) return true;
    return godMode ?? false;
}
