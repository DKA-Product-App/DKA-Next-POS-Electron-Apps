'use client';

import * as React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // ⬅️ pakai styles

type Mode = 'light' | 'dark';

type ThemeChargerValue = {
    mode: Mode;
    setMode: (m: Mode) => void;
    toggleMode: () => void;
};

const ThemeChargerContext = React.createContext<ThemeChargerValue | null>(null);

// Persist
const LS_KEY = 'theme.mode.v1';
const readMode = (): Mode | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LS_KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
};
const writeMode = (m: Mode) => { if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, m); };

export function ThemeChargerProvider({ children }: { children: React.ReactNode }) {
    // default dark, tanpa prefers-color-scheme
    const [mode, setMode] = React.useState<Mode>('dark'); // ⬅️ sama di server & client

    // Setelah mount, sinkron dari LS (kalau ada)
    React.useEffect(() => {
        const saved = readMode();
        if (saved && saved !== mode) setMode(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const theme = React.useMemo(
        () =>
            createTheme({
                direction: 'ltr',
                palette: {
                    mode,
                    // ⬇️ Definisikan explicit biar nggak pernah undefined
                    primary: { main: '#1976d2' },
                    secondary: { main: '#9c27b0' },
                    // (opsional) background & text kalau mau super aman:
                    // background: { default: mode === 'dark' ? '#0b0b0c' : '#fafafa', paper: mode === 'dark' ? '#121212' : '#fff' },
                    // text: { primary: mode === 'dark' ? '#fff' : '#000' },
                },
            }),
        [mode]
    );

    React.useEffect(() => { writeMode(mode); }, [mode]);

    const toggleMode = React.useCallback(() => setMode(p => (p === 'light' ? 'dark' : 'light')), []);
    const value = React.useMemo<ThemeChargerValue>(() => ({ mode, setMode, toggleMode }), [mode, toggleMode]);

    return (
        <ThemeChargerContext.Provider value={value}>
            <ThemeProvider theme={theme}>
                {/* enableColorScheme bagus, tapi opsional */}
                <CssBaseline enableColorScheme />
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
