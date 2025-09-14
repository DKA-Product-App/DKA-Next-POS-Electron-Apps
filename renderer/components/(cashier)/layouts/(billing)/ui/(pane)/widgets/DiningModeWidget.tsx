'use client';

import React, { FC, memo } from 'react'
import { Box, Paper, Stack, Tooltip, Typography } from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'

// Icons
import RestaurantRounded from '@mui/icons-material/RestaurantRounded'
import TakeoutDiningRounded from '@mui/icons-material/TakeoutDiningRounded'
import DeliveryDiningRounded from '@mui/icons-material/DeliveryDiningRounded'

type Option = {
    key: string
    label: string
    icon: React.ReactNode
    hint?: string
}

const DEFAULT_OPTIONS: Option[] = [
    { key: 'dine_in',      label: 'Dine In',      icon: <RestaurantRounded/>,     hint: 'Makan di tempat' },
    { key: 'take_away',    label: 'Take Away',    icon: <TakeoutDiningRounded/>,  hint: 'Bungkus / Dibawa pulang' },
    { key: 'online_order', label: 'Online Order', icon: <DeliveryDiningRounded/>, hint: 'ShopeeFood • GoFood • GrabFood' },
]

type Props = {
    defaultValue?: string | null
    onChange?: (v: string) => void
    options?: Option[]
}

const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'

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
        sx={(t) => {
            const neutralBg = t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.grey[100]
            const neutralHover = t.palette.action.hover
            const focusRing =
                t.palette.mode === 'dark'
                    ? '0 0 0 2px rgba(255,255,255,0.25)'
                    : '0 0 0 2px rgba(0,0,0,0.18)'

            return {
                position: 'relative',
                width: 120,
                height: 120,
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
                bgcolor: neutralBg,
                color: t.palette.text.secondary,
                transition: t.transitions.create(
                    ['transform','box-shadow','border-color','background-color','color','opacity'],
                    { duration: t.transitions.duration.shorter }
                ),
                boxShadow: 'none',

                // Hover: netral
                '&:hover': {
                    backgroundColor: neutralHover,
                    boxShadow: t.shadows[2],
                    transform: 'translateY(-2px)',
                },

                // Focus ring
                '&:focus-visible': {
                    boxShadow: focusRing,
                },
            }
        }}
    >
        <Box
            sx={(t) => ({
                width: 40, height: 40, borderRadius: '50%',
                display: 'grid', placeItems: 'center', flexShrink: 0,
                background: t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[300],
                color: t.palette.text.secondary,
                border: `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                transition: t.transitions.create(['background-color','color','border-color','opacity'], { duration: 120 }),
                mb: 1,
            })}
        >
            {icon}
        </Box>

        <Stack flex={0} minWidth={0} spacing={0.25} sx={{ px: .5, maxWidth: '100%' }}>
            <Typography fontWeight={800} fontSize={13} textAlign="center" sx={{ wordBreak: 'break-word', lineHeight: 1.25 }}>
                {label}
            </Typography>
            {hint && (
                <Typography
                    variant="caption"
                    textAlign="center"
                    sx={{ fontSize: 10.5, opacity: 0.75, lineHeight: 1.2, wordBreak: 'break-word' }}
                >
                    {hint}
                </Typography>
            )}
        </Stack>

        {/* dekorator strip bawah hanya kalau active */}
        {active && (
            <Box sx={{
                position: 'absolute',
                left: 8, right: 8, bottom: 6,
                height: 3,
                borderRadius: 3,
                background: GRADIENT
            }}/>
        )}
    </Paper>
)

const DiningModeWidget: FC<Props> = memo(({ defaultValue = null, onChange, options = DEFAULT_OPTIONS }) => {
    const [selected, setSelected] = React.useState<string | null>(defaultValue)
    const pick = (v: string) => { setSelected(v); onChange?.(v) }

    return (
        <Box sx={{ my: 1, width: '100%', overflow: 'hidden' }}>
            {/* dekorasi tipis atas */}
            <Box sx={{ height: 4, borderRadius: 2, background: GRADIENT, opacity: 0.8, mb: 1 }} />

            <PerfectScrollbar
                style={{ width: '100%', maxWidth: '100%' }}
                options={{ suppressScrollY: true, suppressScrollX: false, useBothWheelAxes: true, swipeEasing: true, wheelPropagation: false }}
            >
                <Box sx={{ display: 'flex', gap: 1, pr: 1, minWidth: 'max-content' }}>
                    {options.map(opt => {
                        const active = selected === opt.key
                        return (
                            <Tooltip key={opt.key} title={active ? 'Terpilih' : 'Pilih opsi ini'} placement="top" arrow>
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

            {/* dekorasi tipis bawah */}
            <Box sx={{ height: 4, borderRadius: 2, background: GRADIENT, opacity: 0.8, mt: 1 }} />
        </Box>
    )
})

DiningModeWidget.displayName = 'DiningModeWidget'
export default DiningModeWidget
