'use client'

import * as React from 'react'
import { Box, Button, Dialog, DialogTitle, DialogContent, IconButton, Stack, Typography } from '@mui/material'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DarkModeRounded from '@mui/icons-material/DarkModeRounded'
import LightModeRounded from '@mui/icons-material/LightModeRounded'
import FullscreenRounded from '@mui/icons-material/FullscreenRounded'
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded'
import dynamic from 'next/dynamic'
import { useTheme } from '@mui/material/styles'
import { useThemeCharger } from '../../../../../../context/ThemeCharger'
import { useLayoutManipulatorSingle } from '../../../context/LayoutManipulatorSingleContext'
import { useEffect, useState } from 'react'
import {useDiningMode} from "../../../context/DiningModeContext";

const Billing = dynamic(() => import('../../../../../(select-product)'), { ssr: false })
const SelectTables = dynamic(() => import('../../../../../(select-tables)'), { ssr: false })

// ⬇️ NEW: terima callback dari parent
type Props = { onCreated?: () => void }

const NewOrderModal: React.FC<Props> = ({ onCreated }) => {
    const { setDefaultValue, setDisableOtherDefault } = useDiningMode()
    const [open, setOpen] = React.useState(false)
    const [fullScreen, setFullScreen] = React.useState(false)
    const { layout, setLayout } = useLayoutManipulatorSingle()
    const [selectionTable, setSelectionTable] = useState<string | undefined>(undefined)

    const theme = useTheme()
    const isDark = (theme.palette as any)?.mode === 'dark' || (theme.palette as any)?.colorScheme === 'dark'
    const { toggleMode } = useThemeCharger()

    const openDialog = () => {
        setOpen(true)
    }

    // 2) (opsional) jaga2 juga di close handler
    const closeDialog = () => {
        setOpen(false)
        // hard reset biar nggak ada race dari efek lain
        setDefaultValue(null)
        setDisableOtherDefault(false)
    }

    const callbackFinalTakeOrder = (item: any[]) => {
        const itemRefactor = item.map((i) => ({
            ...i.variant,
            product: i.variant.product,
            variant: i.variant,
            note: i.note,
            qty: Number(i.qty),
            price: Number(i.price),
            sub_total: Number(i.price) * Number(i.qty),
        }))

        const payload = {
            reference: { id: "00000000-0000-5000-a000-000000000000" },
            branch: [{ id: "00000000-0000-5000-a000-000000000000" }],
            shift: { id: "00000000-0000-5000-a000-000000000000" },
            order_type: { id: "00000000-0000-5000-a000-000000000000" },
            table: { id: selectionTable },
            invoice: Math.floor(10000 + Math.random() * 90000),
            batches: [
                { branch: [{ id: "00000000-0000-5000-a000-000000000000"}], batch: 1, items: itemRefactor },
            ],
        }

        window.api?.invoke('api.transaction:create', payload)
            .then((result) => {
                console.log(result)
                // ⬇️ NEW: kabari parent biar refetch list TANPA mengubah filter
                onCreated?.()
                closeDialog()
            })
            .catch((error) => {
                console.error(error)
            })
    }

    // 1) Tambah efek reset yang ngikutin 'open' + cleanup unmount
    useEffect(() => {
        // kalau dialog kebuka, kita biarin selectable (no lock)
        if (open) {
            setDefaultValue(null)
            setDisableOtherDefault(false)
        } else {
            // dialog ketutup → pastikan reset
            setDefaultValue(null)
            setDisableOtherDefault(false)
        }

        // safety net saat komponen kebuang dari DOM
        return () => {
            setDefaultValue(null)
            setDisableOtherDefault(false)
        }
    }, [open, setDefaultValue, setDisableOtherDefault])

    useEffect(() => {
        if (!open) return
        setSelectionTable(undefined)
        setLayout(
            <SelectTables onSelectTable={(id: string) => setSelectionTable(id)} />
        )
        return () => setLayout(null as unknown as React.ReactNode)
    }, [open, setLayout])

    useEffect(() => {
        if (selectionTable === undefined) return
        setLayout(<Billing onSubmit={callbackFinalTakeOrder} />)
    }, [selectionTable, setLayout])

    return (
        <>
            <Button
                variant="contained"
                size="large"
                startIcon={<AddRounded />}
                color={'success'}
                sx={{ borderWidth: 2, fontWeight: 800, letterSpacing: .2, '&:hover': { borderWidth: 2 } }}
                onClick={(e) => { e.stopPropagation(); openDialog() }}
            >
                ORDER
            </Button>

            <Dialog
                open={open}
                onClose={() => closeDialog()}
                fullWidth
                maxWidth="xl"
                fullScreen={fullScreen}
                slotProps={{
                    paper: { sx: { display: 'flex', flexDirection: 'column', height: fullScreen ? '100vh' : '85vh', overflow: 'hidden' } },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Pesanan Baru</Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)} aria-label={fullScreen ? 'Keluar layar penuh' : 'Layar penuh'}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>

                        <IconButton size="small" onClick={() => toggleMode()} aria-label={isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {isDark ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>

                        <IconButton size="small" onClick={() => closeDialog()} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                        {layout}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default NewOrderModal
