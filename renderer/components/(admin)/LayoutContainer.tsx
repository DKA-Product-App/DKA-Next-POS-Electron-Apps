'use client';

import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import dynamic from "next/dynamic";
import ShimmerHeaderLoading from "./(components)/(loading)/ShimmerHeaderLoading";
import ShimmerFooterLoading from "./(components)/(loading)/ShimmerFooterLoading";
import { FunctionKeyProvider } from "../../contexts/FunctionKeyProviderContext";

const Header = dynamic(() => import('./(components)/Header'), {
    loading: () => <ShimmerHeaderLoading />,
    ssr: false,
});

const Footer = dynamic(() => import('./(components)/Footer'), {
    loading: () => <ShimmerFooterLoading />,
    ssr: false,
});

export default function LayoutContainer({ children }) {
    const [mode, setMode] = React.useState<'light' | 'dark'>('light');
    const theme = React.useMemo(() => createTheme({ palette: { mode }, direction: 'ltr' }), [mode]);

    // ==== IPC helpers (tanpa invoke) ====
    const requestTheme = (): Promise<'light' | 'dark'> =>
        new Promise((resolve) => {
            const off = window.ipc.on('theme:resp', (payload: { mode: 'light' | 'dark' }) => {
                off(); // listen sekali aja buat response
                resolve(payload.mode);
            });
            window.ipc.send('theme:get', null);
        });

    const setThemeIPC = (m: 'dark' | 'light') => window.ipc.send('theme:set', m);

    // Ambil theme awal + subscribe broadcast
    React.useEffect(() => {
        requestTheme().then(setMode);

        const offChanged = window.ipc.on('theme:changed', (payload: { mode: 'dark' | 'light' }) => {
            setMode(payload.mode);
        });

        return () => {
            offChanged();
            // kalau mau bersihin semua listener channel:
            // window.ipc.revoke('theme:changed')
        };
    }, []);

    // Sinkronkan perubahan dari Header ke main/config
    const handleChangeMode = (m: 'light' | 'dark') => {
        setMode(m);
        setThemeIPC(m);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <FunctionKeyProvider>
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ flexShrink: 0 }}>
                        <Header
                            appName="DKA Cashier"
                            cashierName="Yovangga Anandhika"
                            mode={mode}
                            onChangeMode={handleChangeMode}
                            cashierPhotoUrl="#"
                        />
                    </div>

                    <div style={{ flex: 1, minHeight: 0 }}>
                        {children}
                    </div>

                    <div style={{ flexShrink: 0 }}>
                        <Footer />
                    </div>
                </div>
            </FunctionKeyProvider>
        </ThemeProvider>
    );
}
