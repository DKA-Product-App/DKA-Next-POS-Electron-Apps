'use client';

import React, {FC} from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import dynamic from "next/dynamic";
import ShimmerHeaderLoading from "./(components)/(loading)/ShimmerHeaderLoading";
import ShimmerFooterLoading from "./(components)/(loading)/ShimmerFooterLoading";
import { FunctionKeyProvider } from "../../contexts/FunctionKeyProviderContext";
import {ThemeChargerProvider, useThemeCharger} from "../../contexts/ThemeCharger";
import { GodModeProviderProvider } from "./context/GodModeProviderContext";

const Header = dynamic(() => import('./(components)/Header'), {
    loading: () => <ShimmerHeaderLoading />,
    ssr: false,
});

const Footer = dynamic(() => import('./(components)/Footer'), {
    loading: () => <ShimmerFooterLoading />,
    ssr: false,
});

const Body : FC<{ children : React.ReactNode }> = ({ children }) => {
    const { mode, setMode } = useThemeCharger();

    return (
        <FunctionKeyProvider>
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flexShrink: 0 }}>
                    <Header
                        mode={mode}
                        onChangeMode={setMode}     // langsung panggil setMode
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
    )
}
export default function LayoutContainer({ children }) {
    return (
        <ThemeChargerProvider>
            <GodModeProviderProvider>
                <Body>
                    { children }
                </Body>
            </GodModeProviderProvider>

        </ThemeChargerProvider>
    );
}
