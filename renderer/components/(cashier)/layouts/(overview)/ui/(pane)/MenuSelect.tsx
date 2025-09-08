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
    // segmen yang mau ditambahkan ke url sekarang
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
    return `${b}/${s}/`.replace(/\/{2,}/g, '/'); // SELALU pakai trailing slash
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
            bgcolor: (t) =>
                t.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.5)'
                    : 'rgba(255,255,255,0.7)',
            borderBottom: '1px solid',
            borderColor: 'divider',
        }}
    >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={800}>
                Main Menu
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
                        label: 'Pesanan Baru',
                        action: 'new_order',
                        icon: <AddShoppingCartRoundedIcon />,
                        hint: 'Buat transaksi baru',
                        forward: 'billing', // -> {pathname}/billing/
                    },
                    {
                        label: 'Pilih Meja',
                        action: 'open_orders',
                        icon: <ListAltRoundedIcon />,
                        hint: 'Pilih Meja',
                        disabled : false,
                        forward: 'select-tables',
                    },
                    {
                        label: 'Tahan / Draft Pesanan',
                        action: 'hold_orders',
                        icon: <ReplayRoundedIcon />,
                        disabled : true,
                        hint: 'Kelola pesanan ditahan',
                    },
                    {
                        label: 'Reservasi',
                        action: 'reservation',
                        icon: <EventSeatRoundedIcon />,
                        disabled : true,
                        hint: 'Kelola reservasi meja / booking',
                    },
                    {
                        label: 'Retur / Refund',
                        action: 'refund',
                        icon: <ReceiptLongRoundedIcon />,
                        disabled : true,
                        hint: 'Proses pengembalian transaksi',
                    },
                    {
                        label: 'Cetak Ulang Struk',
                        action: 'reprint',
                        icon: <PrintRoundedIcon />,
                        disabled : true,
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

        console.log(newPath);
        console.log(pathname);
        // Hindari push ke URL yang sama → mencegah retrigger render yang bisa bikin fallback “ngebatu”
        if (newPath === pathname || newPath === pathname + '/') return;

        if (process.env.NODE_ENV === 'development') {
            // Debug lokal aja
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
                background: (t) =>
                    t.palette.mode === 'dark'
                        ? t.palette.background.paper
                        : `linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)`,
            }}
        >
            <HeaderBar />

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                    <List disablePadding>
                        {groups.map((g) => (
                            <Box key={g.title}>
                                <Divider textAlign="left" sx={{ px: 1.5, py: 1 }}>
                                    <Typography variant="overline" color="text.secondary">
                                        {g.title}
                                    </Typography>
                                </Divider>

                                {g.items.map((it) => (
                                    <Tooltip key={it.action} title={it.hint || ''} placement="right" arrow>
                                        <ListItemButton
                                            disabled={it.disabled}
                                            onClick={() => handleClick(it)}
                                            sx={{
                                                px: 1.5,
                                                py: 2,
                                                '& .MuiListItemIcon-root': { minWidth: 40 },
                                                transition: 'background-color 120ms',
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            <ListItemIcon>{it.icon}</ListItemIcon>
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
