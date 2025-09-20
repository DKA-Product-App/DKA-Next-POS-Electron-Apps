'use client';

import * as React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

type Mode = 'light' | 'dark';

type ThemeChargerValue = {
    mode: Mode;
    setMode: (m: Mode) => void;
    toggleMode: () => void;
};

const ThemeChargerContext = React.createContext<ThemeChargerValue | null>(null);

export function ThemeChargerProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = React.useState<Mode>('light'); // in-memory only

    const theme = React.useMemo(() => createTheme({ palette: { mode }, direction: 'ltr' }), [mode]);

    const toggleMode = React.useCallback(() => setMode(prev => (prev === 'light' ? 'dark' : 'light')), []);

    const value = React.useMemo<ThemeChargerValue>(() => ({ mode, setMode, toggleMode }), [mode, toggleMode]);

    return (
        <ThemeChargerContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeChargerContext.Provider>
    );
}

export function useThemeCharger() {
    const ctx = React.useContext(ThemeChargerContext);
    if (!ctx) throw new Error('useThemeCharger must be used within ThemeChargerProvider');
    return ctx;
}
