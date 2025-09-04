'use client';

import React from "react";
import ResizableGrid from "./ui/ResizableContainer";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import Header from "./ui/(components)/Header";
import Footer from "./ui/(components)/Footer";
import dynamic from "next/dynamic";

const MenuSelect = dynamic(() => import('./ui/(pane)/MenuSelect'), {
    loading: () => <></>,
    ssr: false,
})

export default function Billing() {

    const [mode, setMode] = React.useState<'light'|'dark'>('dark')
    const theme = React.useMemo(() => createTheme({ palette: { mode }, direction : 'ltr' }), [mode])

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{flexShrink: 0}}>
                    <Header
                        appName="DKA Cashier"
                        cashierName="Yovangga Anandhika"
                        mode={mode}
                        onChangeMode={setMode}
                        cashierPhotoUrl="#"
                    />
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <ResizableGrid
                        left={<></>}
                        right={<MenuSelect/>}
                    />
                </div>

                <div style={{flexShrink: 0}}>
                    <Footer/>
                </div>
            </div>
        </ThemeProvider>
    )
}
