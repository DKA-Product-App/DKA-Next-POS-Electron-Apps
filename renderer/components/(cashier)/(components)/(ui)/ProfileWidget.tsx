'use client'

import * as React from 'react'
import {
    Avatar, Badge, Box, Chip, Divider, IconButton, List, ListItemButton, ListItemIcon,
    ListItemText, Popover, Stack, Tooltip, Typography
} from '@mui/material'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import {usePathname, useRouter} from "next/navigation";

type ProfileWidgetProps = {
    cashierName?: string
    cashierPhotoUrl?: string
    /** Info kecil tambahan di header popover (opsional), mis. branch/register */
    subInfo?: string
    width?: number
    maxHeight?: number

    onOpenSettings?: () => void
    onSwitchCashier?: () => void
    onLogout?: () => void

    /** Ukuran avatar */
    avatarSize?: number
}

const noop = () => {}

export default function ProfileWidget({
                                          cashierName = 'Kasir',
                                          cashierPhotoUrl,
                                          subInfo,
                                          width = 320,
                                          maxHeight = 260,
                                          onOpenSettings = noop,
                                          onSwitchCashier = noop,
                                          onLogout = noop,
                                          avatarSize = 36,
                                      }: ProfileWidgetProps) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const open = Boolean(anchorEl)

    const pathname = usePathname();
    const router = useRouter();

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
    const handleClose = () => setAnchorEl(null)

    const Item = ({
                      icon,
                      primary,
                      secondary,
                      onClick,
                  }: {
        icon: React.ReactNode
        primary: string
        secondary?: string
        onClick: () => void
    }) => (
        <ListItemButton onClick={() => { handleClose(); onClick() }} sx={{ px: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
            <ListItemText
                primary={<Typography variant="body1" fontWeight={600}>{primary}</Typography>}
                secondary={secondary ? <Typography variant="caption" color="text.secondary">{secondary}</Typography> : null}
            />
        </ListItemButton>
    )

    return (
        <>
            {/* Anchor: Avatar kasir */}
            <Tooltip title={cashierName}>
                <Avatar
                    src={cashierPhotoUrl}
                    alt={cashierName}
                    onClick={handleOpen}
                    sx={{
                        width: avatarSize,
                        height: avatarSize,
                        border: '2px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                />
            </Tooltip>

            {/* Popover anchored ke avatar */}
            <Popover
                id="profile-popover"
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                PaperProps={{
                    sx: { width, borderRadius: 3, overflow: 'hidden' },
                    elevation: 8,
                }}
            >
                {/* Header profil */}
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar src={cashierPhotoUrl} alt={cashierName} sx={{ width: 40, height: 40 }}>
                            <PersonRoundedIcon />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={800} noWrap title={cashierName}>
                                {cashierName}
                            </Typography>
                            {subInfo && (
                                <Typography variant="caption" color="text.secondary" noWrap title={subInfo}>
                                    {subInfo}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                </Box>

                {/* Menu (scrollable) */}
                <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}  style={{ maxHeight }}>
                    <List disablePadding>
                        <Item
                            icon={<SettingsRoundedIcon />}
                            primary="Pengaturan"
                            onClick={onOpenSettings}
                        />
                        <Divider component="li" />
                        <Item
                            icon={<SwapHorizRoundedIcon />}
                            primary="Ganti Kasir"
                            onClick={onSwitchCashier}
                        />
                        <Divider component="li" />
                        <Item
                            icon={<LogoutRoundedIcon />}
                            primary="Keluar"
                            onClick={() => {
                                router.replace(`/auth`)
                            }}
                        />
                    </List>
                </PerfectScrollbar>
            </Popover>
        </>
    )
}
