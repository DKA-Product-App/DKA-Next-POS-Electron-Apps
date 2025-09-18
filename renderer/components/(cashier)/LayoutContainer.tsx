'use client';

import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import dynamic from "next/dynamic";
import ShimmerHeaderLoading from "./(components)/(loading)/ShimmerHeaderLoading";
import ShimmerFooterLoading from "./(components)/(loading)/ShimmerFooterLoading";
import { FunctionKeyProvider } from "../../contexts/FunctionKeyProviderContext";
import {LayoutManipulatorResizableProvider} from "../../contexts/LayoutManipulatorResizableContext";

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

    const theme = React.useMemo(
        () => createTheme({ palette: { mode }, direction: 'ltr' }),
        [mode]
    );

    // ==== IPC wrappers: TANPA invoke ====
    const requestTheme = (): Promise<'light' | 'dark'> =>
        new Promise((resolve) => {
            // pasang listener SEKALI untuk response
            const off = window.ipc.on('theme:resp', (payload: { mode: 'light' | 'dark' }) => {
                off(); // unsubscribe listener khusus response
                resolve(payload.mode);
            });
            // kirim request
            window.ipc.send('theme:get', null);
        });

    const setThemeIPC = (m: 'dark' | 'light') => window.ipc.send('theme:set', m);
    const toggleThemeIPC = () => window.ipc.send('theme:toggle', null);

    // Ambil theme awal & subscribe perubahan
    React.useEffect(() => {
        requestTheme().then(setMode);

        const offChanged = window.ipc.on('theme:changed', (payload: { mode: 'dark' | 'light' }) => {
            setMode(payload.mode);
        });

        return () => {
            // Unsubscribe spesifik listener
            offChanged();
            // Atau: window.ipc.revoke('theme:changed') untuk bersihin semua listener channel tsb
        };
    }, []);

    // Handler toggle/set dari Header
    const handleChangeMode = (m: 'dark' | 'light') => {
        setMode(m);
        setThemeIPC(m); // sync ke main + simpan ke config repository
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <LayoutManipulatorResizableProvider>
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
            </LayoutManipulatorResizableProvider>
        </ThemeProvider>
    );
}
