'use client';

import React, {FC, useEffect} from 'react'
import {
    createTheme,
    CssBaseline,
    Stack,
    ThemeProvider,
    Box,
    Divider
} from '@mui/material'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import dynamic from 'next/dynamic'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { ThemeChargerProvider, useThemeCharger } from "../../contexts/ThemeCharger";
import {FunctionKeyProvider, useFunctionKeyCtx} from "../../contexts/FunctionKeyProviderContext";

const Content = dynamic(() => import('./components/Content'), { ssr: false })
const FooterStatus = dynamic(() => import('./components/FooterStatus'), { ssr: false })

const Body : FC<{ children : React.ReactNode }> = ({ children }) => {
    const {mode, setMode} = useThemeCharger();
    const { key, seq } = useFunctionKeyCtx();

    useEffect(() => {
        switch (key) {
            case "F7" :
                window?.ipc?.send?.(`key.window.fullscreen`, true);
                break;
            case "F8" :
                window?.ipc?.send?.(`key.window.dev.mode`, true);
                break;
        }
    }, [seq]);

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Scrollable content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                    <Stack
                        direction="column"
                        component="main"
                        sx={[
                            {
                                position: 'relative',
                                justifyContent: 'center',
                                minHeight: '100%',
                                p: 2
                            },
                            (theme) => ({
                                '&::before': {
                                    content: '""',
                                    display: 'block',
                                    position: 'absolute',
                                    zIndex: -1,
                                    inset: 0,
                                    backgroundImage:
                                        theme.palette.mode === 'dark'
                                            ? 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
                                            : 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
                                    backgroundRepeat: 'no-repeat'
                                }
                            })
                        ]}
                    >
                        {/* Toggle Mode */}
                        <Box
                            sx={{
                                position: { xs: 'static', md: 'absolute' },
                                top: { md: 16 },
                                right: { md: 16 },
                                alignSelf: { xs: 'center', md: 'unset' },
                                mb: { xs: 2, md: 0 },
                                zIndex: 10
                            }}
                        >
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                value={mode}
                                onChange={(_event, value: 'light' | 'dark' | null) => {
                                    if (!value) return;            // ⬅️ cegah setMode(null)
                                    setMode(value);
                                }}
                                sx={(theme) => ({
                                    bgcolor: theme.palette.background.paper,
                                    borderRadius: 999,
                                    p: 0.5,
                                    boxShadow:
                                        theme.palette.mode === 'dark'
                                            ? '0 6px 20px rgba(0,0,0,.35)'
                                            : '0 6px 20px rgba(0,0,0,.08)'
                                })}
                            >
                                <ToggleButton value="light" aria-label="Light mode" sx={{ borderRadius: 999, px: 1.25 }}>
                                    <LightModeRoundedIcon fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="dark" aria-label="Dark mode" sx={{ borderRadius: 999, px: 1.25 }}>
                                    <DarkModeRoundedIcon fontSize="small" />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Stack
                            direction={{ xs: 'column-reverse', md: 'row' }}
                            sx={{ justifyContent: 'center', gap: { xs: 6, sm: 12 }, mx: 'auto', width: '100%' }}
                        >
                            <Stack
                                direction={{ xs: 'column-reverse', md: 'row' }}
                                sx={{ justifyContent: 'center', gap: { xs: 6, sm: 12 }, p: { xs: 2, sm: 4 }, m: 'auto' }}
                            >
                                {/* Content hanya muncul di md+ */}
                                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                    <Content />
                                </Box>

                                {children}
                            </Stack>
                        </Stack>

                        {/* Divider jadi space antara content & footer */}
                        <Divider sx={{ mt: 4, mb: 6, opacity: 0 }} />
                    </Stack>
                </PerfectScrollbar>
            </Box>

            {/* Footer fixed di bawah */}
            <FooterStatus />
        </Box>
    )
}

export function LayoutContainer({ children }) {

    return (
        <ThemeChargerProvider>
            <FunctionKeyProvider>
                <Body>
                    { children }
                </Body>
            </FunctionKeyProvider>
        </ThemeChargerProvider>
    )
}

export default LayoutContainer
