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
    position: 'relative',
    backgroundColor: (theme.vars ?? theme).palette.background.paper,
    ...theme.typography.body2,
    padding: 0,                    // 🔥 buang padding biar full-bleed
    textAlign: 'initial',          // biar konten ngikut layout masing-masing
    color: (theme.vars ?? theme).palette.text.secondary,
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 0,
}))

export default function ResizableGrid({
                                          left,
                                          right,
                                          defaultSize = '18%',
                                          minSize = 400,
                                      }: ResizableGridProps) {
    const [maxSize, setMaxSize] = React.useState<number>()

    React.useEffect(() => {
        const updateMaxSize = () => setMaxSize(window.innerWidth - (minSize ?? 0))
        updateMaxSize()
        window.addEventListener('resize', updateMaxSize)
        return () => window.removeEventListener('resize', updateMaxSize)
    }, [minSize])

    return (
        <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true, wheelPropagation: false }}>
            <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {/* @ts-expect-error */}
                <SplitPane
                    split="vertical"
                    minSize={minSize}
                    maxSize={maxSize}
                    defaultSize={defaultSize}
                    style={{ height: '100%' }}
                    paneStyle={{ display: 'flex', flexDirection: 'column' }}
                    resizerStyle={{
                        cursor: 'col-resize',
                        width: 8,
                        margin: '0 -2px',
                        border: '1px solid #aaa',
                    }}
                >
                    <PaneContent>
                        {/* Scroll/spacing atur di komponen kiri masing-masing */}
                        <Box sx={{ minHeight: '100%' }}>{left}</Box>
                    </PaneContent>

                    <PaneContent>
                        <Box sx={{ minHeight: '100%' }}>{right}</Box>
                    </PaneContent>
                </SplitPane>
            </Box>
        </PerfectScrollbar>
    )
}
