'use client';

import React from "react";
import dynamic from "next/dynamic";
import ShimmerHeaderLoading from "./(components)/(loading)/ShimmerHeaderLoading";
import ShimmerFooterLoading from "./(components)/(loading)/ShimmerFooterLoading";
import { FunctionKeyProvider } from "../../contexts/FunctionKeyProviderContext";
import { LayoutManipulatorResizableProvider } from "../../contexts/LayoutManipulatorResizableContext";
import { ThemeChargerProvider, useThemeCharger } from "../../contexts/ThemeCharger";
import {LayoutManipulatorSingleProvider} from "./layouts/(main)/(component)/(transaction)/context/LayoutManipulatorSingleContext";
import {GodModeProviderProvider} from "./context/GodModeProviderContext";
import {UserConfigProvider} from "../../contexts/UserConfigContext";

const Header = dynamic(() => import('./(components)/Header'), { loading: () => <ShimmerHeaderLoading />, ssr: false });
const Footer = dynamic(() => import('./(components)/Footer'), { loading: () => <ShimmerFooterLoading />, ssr: false });

// Body terpisah supaya bisa pakai hook setelah provider
function LayoutBody({ children }: { children: React.ReactNode }) {
    const { mode, setMode } = useThemeCharger();

    return (
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
    );
}

export default function LayoutContainer({ children }: { children: React.ReactNode }) {
    return (
        <UserConfigProvider>
            <ThemeChargerProvider>
                <GodModeProviderProvider>
                    <LayoutManipulatorResizableProvider>
                        <LayoutManipulatorSingleProvider>
                            <FunctionKeyProvider>
                                <LayoutBody>{children}</LayoutBody>
                            </FunctionKeyProvider>
                        </LayoutManipulatorSingleProvider>
                    </LayoutManipulatorResizableProvider>
                </GodModeProviderProvider>
            </ThemeChargerProvider>
        </UserConfigProvider>

    );
}
