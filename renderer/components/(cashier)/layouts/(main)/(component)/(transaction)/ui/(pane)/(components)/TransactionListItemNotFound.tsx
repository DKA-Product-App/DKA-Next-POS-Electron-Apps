// TransactionListItemNotFound.tsx
'use client'

import * as React from 'react'
import { Box, Paper, Stack, Typography, Button } from '@mui/material'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import ReplayRounded from '@mui/icons-material/ReplayRounded'

type Props = {
    onRetry?: () => void
}

const TransactionListItemNotFound: React.FC<Props> = ({ onRetry }) => {
    return (
        <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
            <Paper
                elevation={0}
                sx={(t) => ({
                    maxWidth: 640,
                    width: '100%',
                    p: 3,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: t.palette.mode === 'dark' ? 'background.default' : 'background.paper',
                    textAlign: 'center',
                })}
            >
                <Stack spacing={1.25} alignItems="center">
                    <InfoOutlined color="info" sx={{ fontSize: 36 }} />
                    <Typography variant="h6" fontWeight={900}>
                        Tidak ada transaksi yang dipilih
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Silakan pilih salah satu transaksi pada panel kiri untuk menampilkan rincian lengkapnya.
                        Anda dapat menggunakan kolom pencarian serta filter waktu, shift, dan kasir untuk mempersempit hasil.
                        Tips: klik kembali pada transaksi yang sama untuk menutup panel rincian.
                    </Typography>

                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            startIcon={<ReplayRounded />}
                            variant="outlined"
                            sx={{ mt: 0.5, textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                        >
                            Coba lagi
                        </Button>
                    )}
                </Stack>
            </Paper>
        </Box>
    )
}

export default React.memo(TransactionListItemNotFound)
