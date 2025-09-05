'use client';

import React from "react";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import dynamic from "next/dynamic";
import ShimmerHeaderLoading from "./(components)/(loading)/ShimmerHeaderLoading";
import ShimmerFooterLoading from "./(components)/(loading)/ShimmerFooterLoading";


const Header = dynamic(() => import('./(components)/Header'), {
    loading : () => <ShimmerHeaderLoading/>,
    ssr : false,
})

const Footer = dynamic(() => import('./(components)/Footer'), {
    loading: () => <ShimmerFooterLoading/>,
    ssr : false,
})

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
