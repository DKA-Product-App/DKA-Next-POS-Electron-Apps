'use client'

import * as React from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Stack, TextField, Button, IconButton, Divider, Typography,
} from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'

import { useSession } from '../../../../../../../contexts/SessionProviderContext'
import { useThemeCharger } from '../../../../../../../contexts/ThemeCharger'
import dynamic from "next/dynamic";
import ShimmerLoading from "../../../../../../(shared)/(loading)/ShimmerLoading";
import ErrorBoundary from '../../../../../../(cashier)/layouts/ErrorBoundary'
import {FloorsTables} from "../../../../../../../types/config/data/floors.tables.type";

export type NewModalProps = {
    onCreated?: (created?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}


const TablesCreator = dynamic(() => import("./(tables-creator)"), {
    loading : () => <ShimmerLoading/>,
    ssr : false,
})


export default function NewModal(props: NewModalProps) {
    const { onCreated, triggerLabel = 'Tambah Meja', triggerProps } = props
    const { Session } = useSession()
    const { mode, toggleMode } = useThemeCharger()

    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)


    const openModal = () => setOpen(true)
    const closeModal = () => setOpen(false)

    // reset saat modal ditutup
    React.useEffect(() => {
        if (open) return
    }, [open])

    // === Handlers ===

    const onSubmit = (data : FloorsTables[]) => {
        console.log(data)
    }

    return (
        <>
            <Button
                variant="contained"
                size="small"
                startIcon={<AddRounded />}
                onClick={openModal}
                sx={{ borderRadius: 2 }}
                {...triggerProps}
            >
                {triggerLabel}
            </Button>

            <Dialog
                open={open}
                onClose={closeModal}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                slotProps={{
                    paper: {
                        sx: { height: fullScreen ? '100vh' : '80vh', display: 'flex', bgcolor: 'background.paper', flexDirection: 'column' }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Lantai</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={toggleMode} aria-label={(mode === 'dark') ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {(mode === 'dark') ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={closeModal} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'background.paper', overflow: 'hidden' }}>
                    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%' }}>
                        <ErrorBoundary>
                            <TablesCreator key="tables-creator" onSubmit={onSubmit} />
                        </ErrorBoundary>
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}
