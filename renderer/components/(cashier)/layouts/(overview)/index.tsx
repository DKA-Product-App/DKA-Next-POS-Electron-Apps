'use client';

import React from "react";
import ResizableGrid from "./ui/ResizableContainer";
import {createTheme} from "@mui/material";
import dynamic from "next/dynamic";

const MenuSelect = dynamic(() => import('./ui/(pane)/MenuSelect'), {
    loading: () => <></>,
    ssr: false,
})

export default function Overview() {

    const [mode, setMode] = React.useState<'light'|'dark'>('dark')
    const theme = React.useMemo(() => createTheme({ palette: { mode }, direction : 'ltr' }), [mode])

    return (
        <ResizableGrid
            left={<></>}
            right={<MenuSelect/>}
        />
    )
}
