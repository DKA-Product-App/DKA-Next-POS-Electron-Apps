'use client';

import React, {FC, memo} from 'react'
import {Box, Paper, Stack, Tooltip, Typography} from '@mui/material'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {useDiningMode} from "../../../../(main)/(transaction)/context/DiningModeContext"

type Option = { id: string; code: string; icon: string; name: string; description?: string }
type Props = { onChange?: (v: string) => void; options?: Option[] }

const GRADIENT = 'linear-gradient(90deg, #6366F1, #8B5CF6 35%, #EC4899)'
type IconVariant = 'rounded' | 'outlined' | 'sharp' | 'two-tone'
type DbIcon = { provider: 'material-symbols'; name: string; variant?: IconVariant }

export const DbIconLigature = ({ name, variant='outlined', size=24 }: DbIcon & { size?: number }) => {
    const cls = variant === 'outlined' ? 'material-symbols-outlined'
        : variant === 'sharp' ? 'material-symbols-sharp'
            : variant === 'two-tone' ? 'material-symbols-two-tone'
                : 'material-symbols-rounded'
    return <Box component="span" className={cls} sx={{ fontSize: size, lineHeight: 1 }}>{name}</Box>
}

const DiningCard: FC<{
    active: boolean
    disabled?: boolean
    label: string
    icon: string
    hint?: string
    onClick: () => void
}> = ({active, disabled = false, label, hint, icon, onClick}) => {
    return (
        <Paper
            role="button"
            aria-label={label}
            aria-pressed={active}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={disabled ? undefined : onClick}
            onKeyDown={(e) => {
                if (disabled) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() }
            }}
            variant="outlined"
            sx={(t) => {
                const neutralBg = t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.grey[100]
                const neutralHover = t.palette.action.hover
                const focusRing = t.palette.mode === 'dark'
                    ? '0 0 0 2px rgba(255,255,255,0.25)'
                    : '0 0 0 2px rgba(0,0,0,0.18)'
                return {
                    position: 'relative',
                    width: 120,
                    height: 120,
                    cursor: disabled ? 'not-allowed' : 'pointer',
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
                        ['transform', 'box-shadow', 'border-color', 'background-color', 'color', 'opacity'],
                        {duration: t.transitions.duration.shorter}
                    ),
                    boxShadow: 'none',
                    opacity: disabled ? 0.5 : 1,
                    '&:hover': disabled ? {} : { backgroundColor: neutralHover, boxShadow: t.shadows[2], transform: 'translateY(-2px)' },
                    '&:focus-visible': disabled ? {} : { boxShadow: focusRing },
                }
            }}
        >
            <Box sx={(t) => ({
                width: 40, height: 40, borderRadius: '50%',
                display: 'grid', placeItems: 'center', flexShrink: 0,
                background: t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[300],
                color: t.palette.text.secondary,
                border: `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
                transition: t.transitions.create(['background-color', 'color', 'border-color', 'opacity'], {duration: 120}),
                mb: 1,
            })}>
                <DbIconLigature name={icon} provider="material-symbols" variant="outlined" size={24}/>
            </Box>

            <Stack flex={0} minWidth={0} spacing={0.25} sx={{px: .5, maxWidth: '100%'}}>
                <Typography fontWeight={800} fontSize={13} textAlign="center" sx={{wordBreak: 'break-word', lineHeight: 1.25}}>
                    {label}
                </Typography>
                {hint && (
                    <Typography variant="caption" textAlign="center" sx={{fontSize: 10.5, opacity: 0.75, lineHeight: 1.2, wordBreak: 'break-word'}}>
                        {hint}
                    </Typography>
                )}
            </Stack>

            {active && (
                <Box sx={{ position: 'absolute', left: 8, right: 8, bottom: 6, height: 3, borderRadius: 3, background: GRADIENT }}/>
            )}
        </Paper>
    )
}

const DiningModeWidget: FC<Props> = memo(({onChange}) => {
    const { defaultValue, disableOtherDefault } = useDiningMode();
    const [selected, setSelected] = React.useState<string | null>(defaultValue)
    const [options, setOptions] = React.useState<Array<Option>>([]);

    const pick = (v: string) => (setSelected(v), onChange?.(v));

    const fetchDiningMode = () =>
        window.api === undefined
            ? console.error(`Failed Get Window Api Bridge`)
            : window.api.invoke("api.config.data.order.type:read.all", {})
                .then((result: any) => (setOptions(result.data), console.log(result)))
                .catch((error: any) => (setOptions([]), console.error(error)));

    React.useEffect(() => { fetchDiningMode() }, [defaultValue])
    React.useEffect(() => { console.log(options); console.log(defaultValue) }, [])

    // sinkronkan state lokal saat context berubah
    React.useEffect(() => setSelected(defaultValue ?? null), [defaultValue, options])

    // reset bila selected tidak ada di options
    React.useEffect(() => {
        if (selected && !options.some(o => o.id === selected)) setSelected(null)
    }, [options, selected])

    const hasDefault = !!defaultValue && options.some(o => o.id === defaultValue)

    return (
        <Box sx={{my: 1, width: '100%', overflow: 'hidden'}}>
            <Box sx={{height: 4, borderRadius: 2, background: GRADIENT, opacity: 0.8, mb: 1}}/>

            <PerfectScrollbar
                style={{width: '100%', maxWidth: '100%'}}
                options={{ suppressScrollY: true, suppressScrollX: false, useBothWheelAxes: true, swipeEasing: true, wheelPropagation: false }}
            >
                <Box sx={{display: 'flex', gap: 1, pr: 1, minWidth: 'max-content'}}>
                    {options.map(opt => {
                        const active = selected === opt.id
                        const disabled = disableOtherDefault && hasDefault ? opt.id !== defaultValue : false
                        const tooltipTitle = disabled ? 'Tidak Dapat Dipilih' : (active ? 'Terpilih' : 'Pilih opsi ini')

                        return (
                            <Tooltip key={opt.id} title={tooltipTitle} placement="top" arrow>
                                <Box>
                                    <DiningCard
                                        active={active}
                                        disabled={disabled}
                                        label={opt.name}
                                        hint={opt.description}
                                        icon={opt.icon}
                                        onClick={() => (disabled ? undefined : pick(opt.id))}
                                    />
                                </Box>
                            </Tooltip>
                        )
                    })}
                </Box>
            </PerfectScrollbar>

            <Box sx={{height: 4, borderRadius: 2, background: GRADIENT, opacity: 0.8, mt: 1}}/>
        </Box>
    )
})

DiningModeWidget.displayName = 'DiningModeWidget'
export default DiningModeWidget
