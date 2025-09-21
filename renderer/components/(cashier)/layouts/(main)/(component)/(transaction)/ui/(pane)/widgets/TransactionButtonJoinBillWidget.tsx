// app/(dashboards)/apps/erp/apps/pos/(transaction)/_components/TransactionButtonJoinBillWidget.tsx
'use client'

import * as React from 'react'
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    IconButton, Stack, Typography, Alert
} from '@mui/material'
// ^ Alert buat notice kalau whitelist kosong
import CallMergeRounded from '@mui/icons-material/CallMergeRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import dynamic from 'next/dynamic'
import {useEffect} from "react";

// NOTE: pastikan path-nya sesuai struktur kamu
const SelectTables = dynamic(() => import('../../../../../../(select-tables)'), { ssr: false })

// Minimal type biar aman (atau import dari shared types kamu)
type TxRef = { table?: { id?: string | null } | null }

type Props = {
    selectedIds: string[]
    selectedTxs: TxRef[]           // ⬅️ dikirim dari parent (TransactionListItem)
    hasClosed: boolean
    onPick?: (payload: { transaction: string[]; tableselectedId: string }) => void
}

const TransactionButtonJoinBillWidget: React.FC<Props> = ({
                                                              selectedIds,
                                                              selectedTxs,
                                                              hasClosed,
                                                              onPick
                                                          }) => {
    const [open, setOpen] = React.useState(false)

    // daftar meja yang boleh dipilih = unique table.id dari transaksi terpilih
    const allowedTableIds = React.useMemo(
        () =>
            Array.from(
                new Set(
                    (selectedTxs ?? [])
                        .map(t => t?.table?.id)
                        .filter((x): x is string => Boolean(x))
                )
            ),
        [selectedTxs]
    )

    const joinEnabled = selectedIds.length > 1 && !hasClosed

    const openDialog = () => setOpen(true)
    const closeDialog = () => setOpen(false)

    // dipanggil saat meja tujuan dipilih
    const handleSelectTable = (id: string) => {
        const payload = { transaction: selectedIds, tableselectedId: id }
        onPick?.(payload)
        closeDialog()
    }

    return (
        <>

            {/* Tombol Gabung */}
            <Button
                variant="contained"
                size="large"
                startIcon={<CallMergeRounded />}
                disabled={!joinEnabled}
                color={'warning'}
                onClick={openDialog}
                sx={{ fontWeight: 800, letterSpacing: .2, opacity: joinEnabled ? 1 : .6 }}
            >
                Join Bill
            </Button>

            {/* Modal pilih meja tujuan */}
            <Dialog
                open={open}
                onClose={closeDialog}
                fullWidth
                maxWidth="xl"
                slotProps={{
                    paper: { sx: { display: 'flex', flexDirection: 'column', height: '85vh', overflow: 'hidden' } },
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Stack spacing={0.25}>
                        <Typography variant="h6" fontWeight={800}>Pilih Meja Tujuan</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {selectedIds.length} transaksi terpilih • {allowedTableIds.length} meja kandidat
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={closeDialog} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', overflow: 'hidden' }}>
                        {allowedTableIds.length === 0 ? (
                            <Box sx={{ p: 2 }}>
                                <Alert severity="warning" variant="outlined">
                                    Nggak ada meja asal dari selection kamu. Pastikan setiap transaksi punya <strong>table.id</strong> yang valid.
                                </Alert>
                            </Box>
                        ) : (
                            // Reuse komponen existing untuk pilih meja
                            <SelectTables
                                onSelectTable={handleSelectTable}
                                allowWishlistIdTable={allowedTableIds} // ⬅️ whitelist aktif
                            />
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default React.memo(TransactionButtonJoinBillWidget)
