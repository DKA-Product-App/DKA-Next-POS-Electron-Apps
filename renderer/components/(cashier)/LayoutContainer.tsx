'use client';

import React from "react";
import Header from "./(components)/Header";
import Footer from "./(components)/Footer";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";


export default function LayoutContainer({ children }) {

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
                    { children }
                </div>

                <div style={{flexShrink: 0}}>
                    <Footer/>
                </div>
            </div>
        </ThemeProvider>
    )
}
