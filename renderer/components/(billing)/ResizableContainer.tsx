'use client'

import * as React from 'react'
import SplitPane from 'react-split-pane'
import { styled } from '@mui/material/styles'
import Paper from '@mui/material/Paper'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { Box } from '@mui/material'

type ResizableGridProps = {
    left: React.ReactNode
    right: React.ReactNode
    defaultSize?: string | number
    minSize?: number
}

const PaneContent = styled(Paper)(({ theme }) => ({
    backgroundColor: '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    height: '100%',
    overflow: 'hidden', // <-- kunci: JANGAN auto di level ini
    display: 'flex',
    flexDirection: 'column',
}))

export default function ResizableGrid({
                                          left,
                                          right,
                                          defaultSize = '70%',
                                          minSize = 500,
                                      }: ResizableGridProps) {
    const [maxSize, setMaxSize] = React.useState<number>()

    React.useEffect(() => {
        const updateMaxSize = () => setMaxSize(window.innerWidth - (minSize ?? 0))
        updateMaxSize()
        window.addEventListener('resize', updateMaxSize)
        return () => window.removeEventListener('resize', updateMaxSize)
    }, [minSize])

    return (
        <Box sx={{ height: '100vh', overflow: 'hidden' /* matiin outer scroll */ }}>
            {/* @ts-expect-error */}
            <SplitPane
                split="vertical"
                minSize={minSize}
                maxSize={maxSize}
                defaultSize={defaultSize}
                style={{ height: '100%' }}              // <-- biar ngisi tinggi penuh
                paneStyle={{ display: 'flex', flexDirection: 'column' }}
                resizerStyle={{
                    background: '#f1f0f0',
                    cursor: 'col-resize',
                    width: '4px',
                    margin: '0 -2px',
                    border: '1px solid #aaa',
                }}
            >
                <PaneContent>
                    {/* Scroll HANYA di sini */}
                    <PerfectScrollbar options={{ suppressScrollX: true }}>
                        <Box sx={{ p: 1, minHeight: '100%' }}>{left}</Box>
                    </PerfectScrollbar>
                </PaneContent>

                <PaneContent>
                    <Box sx={{ p: 1, minHeight: '100%' }}>{right}</Box>
                </PaneContent>
            </SplitPane>
        </Box>
    )
}
