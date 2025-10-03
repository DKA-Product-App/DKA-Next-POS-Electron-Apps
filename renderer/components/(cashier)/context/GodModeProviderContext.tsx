'use client';

import * as React from 'react';

// ✅ biar bisa pakai setLayout(prev => ...)
export type GodModeProviderCtx = {
    godMode: boolean | null;
    setGodMode: React.Dispatch<React.SetStateAction<boolean | null>>;
};

const GodModeProviderContext = React.createContext<GodModeProviderCtx | undefined>(undefined);

export function GodModeProviderProvider({ children }: { children: React.ReactNode }) {
    const [godMode, setGodMode] = React.useState<boolean | null>(null);

    const value = React.useMemo(() => ({ godMode, setGodMode }), [godMode]);

    return (
        <GodModeProviderContext.Provider value={value}>
            {children}
        </GodModeProviderContext.Provider>
    );
}

export function useGodModeProvider() {
    const ctx = React.useContext(GodModeProviderContext);
    if (!ctx) throw new Error('useGodModeProvider must be used within <GodModeProviderProvider>');
    return ctx;
}
