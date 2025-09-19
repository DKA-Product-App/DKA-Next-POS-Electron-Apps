'use client';

import React, { FC, memo, useMemo } from 'react';
import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Typography,
    Tooltip,
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { usePathname, useRouter } from 'next/navigation';

// ==== Icons ====
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';

// =====================
// Types
// =====================
type ActionKey =
    | 'new_order'
    | 'open_orders'
    | 'hold_orders'
    | 'refund'
    | 'reprint'
    | 'reservation'
    | 'open_drawer'
    | 'close_shift'
    | 'x_report'
    | 'z_report'
    | 'sync'
    | 'settings'
    | 'switch_cashier'
    | 'help';

type MenuItem = {
    label: string;
    action: ActionKey;
    icon: React.ReactNode;
    hint?: string;
    disabled?: boolean;
    forward?: string;
};

type MenuGroup = {
    title: string;
    items: readonly MenuItem[];
};

// =====================
// Utils
// =====================
const joinPath = (base: string, seg?: string) => {
    const b = base.replace(/\/+$/, '');
    const s = (seg ?? '').replace(/^\/+/, '');
    return `${b}/${s}/`.replace(/\/{2,}/g, '/');
};

const HeaderBar: FC = () => (
    <Box
        sx={{
            p: 1.5,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backdropFilter: 'saturate(140%) blur(6px)',
            bgcolor: 'transparent',
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6 30%, #EC4899)',
            color: '#fff',
        }}
    >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={800}>
                Apps & Features
            </Typography>
        </Stack>
    </Box>
);

// =====================
// Component
// =====================
export const MenuSelect: FC = memo(function MenuSelect() {
    const router = useRouter();
    const pathname = usePathname();

    const groups: readonly MenuGroup[] = useMemo(
        () => [
            {
                title: 'Transaksi',
                items: [
                    {
                        label: 'New Order',
                        action: 'new_order',
                        icon: <AddShoppingCartRoundedIcon />,
                        hint: 'New Order',
                        forward: 'billing',
                    },
                    {
                        label: 'Pilih Meja',
                        action: 'open_orders',
                        icon: <ListAltRoundedIcon />,
                        hint: 'Pilih Meja',
                        disabled: false,
                        forward: 'select-tables',
                    },
                    {
                        label: 'Reservasi',
                        action: 'reservation',
                        icon: <EventSeatRoundedIcon />,
                        disabled: true,
                        hint: 'Kelola reservasi meja / booking',
                    },
                    {
                        label: 'Retur / Refund',
                        action: 'refund',
                        icon: <ReceiptLongRoundedIcon />,
                        disabled: true,
                        hint: 'Proses pengembalian transaksi',
                    },
                    {
                        label: 'Cetak Ulang Struk',
                        action: 'reprint',
                        icon: <PrintRoundedIcon />,
                        disabled: true,
                        hint: 'Reprint struk transaksi',
                    },
                ],
            },
        ],
        []
    );

    const handleClick = (item: MenuItem) => {
        if (!item.forward) return;

        const newPath = joinPath(pathname, item.forward);
        if (newPath === pathname || newPath === pathname + '/') return;

        if (process.env.NODE_ENV === 'development') {
            console.log('[navigate]', { from: pathname, forward: item.forward, to: newPath });
        }

        router.push(newPath);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                background: (t) =>
                    t.palette.mode === 'dark'
                        ? 'linear-gradient(180deg, #1F1F1F 0%, #0D0D0D 100%)' // 🌌 biru gelap navy
                        : 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            }}
        >
            <HeaderBar />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                    <List disablePadding>
                        {groups.map((g) => (
                            <Box key={g.title}>
                                {g.items.map((it) => (
                                    <Tooltip key={it.action} title={it.hint || ''} placement="right" arrow>
                                        <ListItemButton
                                            disabled={it.disabled}
                                            onClick={() => handleClick(it)}
                                            sx={{
                                                px: 1.5,
                                                py: 2,
                                                borderRadius: 1,
                                                mx: 1,
                                                my: 0.5,
                                                '& .MuiListItemIcon-root': { minWidth: 40 },
                                                transition: 'all 150ms',
                                                '&:hover': {
                                                    bgcolor: 'rgba(139,92,246,0.08)',
                                                    boxShadow: '0 4px 12px rgba(139,92,246,0.25)',
                                                    borderLeft: '4px solid #8B5CF6',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: 'primary.main' }}>{it.icon}</ListItemIcon>
                                            <ListItemText
                                                primary={<Typography fontWeight={600}>{it.label}</Typography>}
                                            />
                                        </ListItemButton>
                                    </Tooltip>
                                ))}
                            </Box>
                        ))}
                    </List>
                </PerfectScrollbar>
            </Box>
        </Paper>
    );
});

export default MenuSelect;
