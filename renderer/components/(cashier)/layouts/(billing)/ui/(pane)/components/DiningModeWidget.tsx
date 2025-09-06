'use client';

import React, { FC, memo } from 'react'
import { Box, Paper, Stack, Tooltip, Typography } from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

// Icons
import RestaurantRounded from '@mui/icons-material/RestaurantRounded'
import TakeoutDiningRounded from '@mui/icons-material/TakeoutDiningRounded'
import DeliveryDiningRounded from '@mui/icons-material/DeliveryDiningRounded'
import {AccessTimeRounded, MoreHorizRounded} from '@mui/icons-material';



type Option = {
    key: string
    label: string
    icon: React.ReactNode
    hint?: string // subtitle kecil opsional, mis. "ShopeeFood • GoFood"
}

const DEFAULT_OPTIONS: Option[] = [
    {
        key: 'dine_in',
        label: 'Dine In',
        icon: <RestaurantRounded />,
        hint: 'Makan di tempat'
    },
    {
        key: 'take_away',
        label: 'Take Away',
        icon: <TakeoutDiningRounded />,
        hint: 'Bungkus / Dibawa pulang'
    },
    {
        key: 'online_order',
        label: 'Online Order',
        icon: <DeliveryDiningRounded />,
        hint: 'ShopeeFood • GoFood • GrabFood'
    }/*,
    {
        key: 'scheduled_order',
        label: 'Scheduled Order',
        icon: <AccessTimeRounded />,
        hint: 'ambil nanti / dijadwalkan'
    },
    {
        key: 'other_order',
        label: 'Other Order',
        icon: <MoreHorizRounded />,
        hint: 'Custom • Catering • Staff Order'
    },*/
]

type Props = {
    /** nilai awal; biar semua abu-abu -> biarkan null/undefined */
    defaultValue?: string | null
    /** callback opsional buat parent */
    onChange?: (v: string) => void
    options?: Option[]
}

const DiningCard: FC<{
    active: boolean
    label: string
    icon: React.ReactNode
    hint?: string
    onClick: () => void
}> = ({ active, label, hint, icon, onClick }) => (
    <Paper
        role="button"
        aria-pressed={active}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        variant="outlined"
        sx={(t) => ({
            width: 120,                      // 🔲 square
            height: 120,                     // 🔲 square
            cursor: 'pointer',
            p: 1,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            outline: 'none',
            borderColor: active ? t.palette.primary.main : 'divider',
            bgcolor: active
                ? t.palette.primary.main       // full colored kalau aktif
                : (t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.grey[100]),
            color: active ? t.palette.primary.contrastText : t.palette.text.secondary,
            transition: t.transitions.create(
                ['transform','box-shadow','border-color','background-color','color'],
                { duration: t.transitions.duration.shorter }
            ),
            boxShadow: active ? 4 : 'none',
            transform: active ? 'translateY(-1px)' : 'none',
            '&:hover': { boxShadow: 6, transform: 'translateY(-1px)' },
        })}
    >
        <Box
            sx={(t) => ({
                width: 40, height: 40, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                flexShrink: 0,
                bgcolor: active
                    ? t.palette.primary.dark
                    : (t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[300]),
                color: active ? t.palette.primary.contrastText : t.palette.text.secondary,
                transition: t.transitions.create(['background-color','color'], { duration: 120 }),
                mb: 1,
            })}
        >
            {icon}
        </Box>

        <Stack flex={0} minWidth={0} spacing={0.25} sx={{ px: .5, maxWidth: '100%' }}>
            <Typography
                fontWeight={700}
                fontSize={13}                 // teks kecil
                textAlign="center"
                sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}
            >
                {label}
            </Typography>

            {/* hint muncul saat aktif atau tidak—tapi tetap kecil & wrap */}
            {hint && (
                <Typography
                    variant="caption"
                    textAlign="center"
                    sx={{
                        fontSize: 10.5,
                        opacity: active ? 0.9 : 0.7,
                        lineHeight: 1.2,
                        wordBreak: 'break-word',
                    }}
                >
                    {hint}
                </Typography>
            )}
        </Stack>
    </Paper>
)

/** Self-contained widget: state di dalam, no badges */
const DiningModeWidget: FC<Props> = memo(({ defaultValue = null, onChange, options = DEFAULT_OPTIONS }) => {
    const [selected, setSelected] = React.useState<string | null>(defaultValue)

    const pick = (v: string) => {
        setSelected(v)
        onChange?.(v)
    }

    return (
        <Box sx={{ my: 1, width: '100%', overflow: 'hidden' }}>
            <PerfectScrollbar
                style={{ width: '100%', maxWidth: '100%' }}
                options={{
                    suppressScrollY: true,
                    suppressScrollX: false,
                    useBothWheelAxes: true,
                    swipeEasing: true,
                    wheelPropagation: false,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        pr: 1,
                        minWidth: 'max-content', // biar konten bisa lebih lebar daripada container
                    }}
                >
                    {options.map(opt => {
                        const active = selected === opt.key
                        return (
                            <Tooltip key={opt.key} title={active ? 'Terpilih' : 'Pilih opsi ini'}>
                                <Box>
                                    <DiningCard
                                        active={active}
                                        label={opt.label}
                                        hint={opt.hint}
                                        icon={opt.icon}
                                        onClick={() => pick(opt.key)}
                                    />
                                </Box>
                            </Tooltip>
                        )
                    })}
                </Box>
            </PerfectScrollbar>
        </Box>
    )
})

DiningModeWidget.displayName = 'DiningModeWidget'
export default DiningModeWidget
