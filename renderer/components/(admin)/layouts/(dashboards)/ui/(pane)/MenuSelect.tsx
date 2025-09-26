'use client';

import React, { FC, memo, useMemo, useState, useCallback } from 'react';
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
    Collapse,
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { usePathname, useRouter } from 'next/navigation';

// ==== Icons (rapih & konsisten) ====
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import AutoAwesomeMotionRoundedIcon from '@mui/icons-material/AutoAwesomeMotionRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';

import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';

import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import RemoveShoppingCartRoundedIcon from '@mui/icons-material/RemoveShoppingCartRounded';

import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';

import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import DevicesOtherRoundedIcon from '@mui/icons-material/DevicesOtherRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';

// =====================
// Types
// =====================
type MenuItemNode = {
    label: string;
    description: string;
    icon?: React.ReactNode;
    forward?: string;
    children?: readonly MenuItemNode[];
};

type MenuGroup = {
    title?: string;
    items: readonly MenuItemNode[];
};

// =====================
// Config
// =====================
const ROOT = '/admin';

// =====================
// Utils
// =====================
const isActivePath = (pathname: string, target?: string) => {
    if (!target) return false;
    const clean = (p: string) => p.replace(/\/+$/, '');
    return clean(pathname) === clean(target) || clean(pathname).startsWith(clean(target) + '/');
};

const HeaderBar: FC = () => (
    <Box
        sx={{
            p: 1,
            px: 1.25,
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
            <Typography variant="subtitle2" fontWeight={800}>
                Admin Menu
            </Typography>
        </Stack>
    </Box>
);

// =====================
// Item Renderer
// =====================
type ItemProps = {
    item: MenuItemNode;
    level?: number;
    pathname: string;
    onNavigate: (to: string) => void;
};

const SidebarItem: FC<ItemProps> = ({ item, level = 0, pathname, onNavigate }) => {
    const [open, setOpen] = useState<boolean>(() => isActivePath(pathname, item.forward));
    const hasChildren = Boolean(item.children?.length);
    const active = isActivePath(pathname, item.forward);

    const handleClick = useCallback(() => {
        if (hasChildren) {
            setOpen((o) => !o);
            return;
        }
        if (!item.forward) return;
        onNavigate(item.forward);
    }, [hasChildren, item.forward, onNavigate]);

    const indent = level * 1.5;

    return (
        <>
            <Tooltip title={item.description} placement="right" arrow>
                <ListItemButton
                    onClick={handleClick}
                    sx={{
                        px: 1 + indent,
                        py: 0.75,
                        mx: 0.5,
                        borderRadius: 1,
                        minHeight: 38,
                        ...(active && {
                            bgcolor: 'action.selected',
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                        }),
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 34, color: active ? 'primary.main' : 'text.secondary' }}>
                        {item.icon ?? <CircleRoundedIcon sx={{ fontSize: 10 }} />}
                    </ListItemIcon>

                    <ListItemText
                        primary={
                            <Typography fontWeight={active ? 700 : 600} variant="body2">
                                {item.label}
                            </Typography>
                        }
                        secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {item.description}
                            </Typography>
                        }
                    />

                    {hasChildren ? (
                        open ? <ExpandMoreRoundedIcon fontSize="small" /> : <KeyboardArrowRightRoundedIcon fontSize="small" />
                    ) : null}
                </ListItemButton>
            </Tooltip>

            {hasChildren && (
                <Collapse in={open} unmountOnExit>
                    <List disablePadding>
                        {item.children!.map((child) => (
                            <SidebarItem key={child.label} item={child} level={(level || 0) + 1} pathname={pathname} onNavigate={onNavigate} />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

// =====================
// Component
// =====================
export const MenuSelect: FC = memo(function MenuSelect() {
    const router = useRouter();
    const pathname = usePathname();

    // Base slug helper biar DRY & konsisten
    const DASH = `${ROOT}/dashboards`;
    const OPS = `${DASH}/operations`;
    const SLA = `${DASH}/sla`;
    const SETTINGS = `${DASH}/settings`;
    const CONFIGS = `${SETTINGS}/configurations`;

    const groups: readonly MenuGroup[] = useMemo(
        () => [
            {
                title: 'General',
                items: [
                    {
                        label: 'Overview',
                        description: 'Ringkasan KPI & statistik utama',
                        icon: <DashboardRoundedIcon />,
                        forward: `${DASH}/overview`,
                    },
                ],
            },
            {
                title: 'Data',
                items: [
                    {
                        label: 'Catalog',
                        description: 'Kelola daftar Catalog',
                        icon: <Inventory2RoundedIcon />,
                        children: [
                            { label: 'Product', description: 'Daftar Product', icon: <LocalMallRoundedIcon />, forward: `${DASH}/products` },
                            { label: 'Variant', description: 'Daftar Variant', icon: <AutoAwesomeMotionRoundedIcon />, forward: `${DASH}/products/variants` },
                            { label: 'Category', description: 'Daftar Category', icon: <CategoryRoundedIcon />, forward: `${DASH}/products/categories` },
                        ],
                    },
                    {
                        label: 'Meja / Floor',
                        description: 'Manage daftar Meja',
                        icon: <TableRestaurantRoundedIcon />,
                        children: [
                            { label: 'Meja', description: 'Daftar Meja', icon: <TableRestaurantRoundedIcon />, forward: `${DASH}/floors/tables` },
                            { label: 'Lantai', description: 'Daftar Lantai', icon: <LayersRoundedIcon />, forward: `${DASH}/floors` },
                        ],
                    },
                ],
            },
            {
                title: 'Operations',
                items: [
                    {
                        label: 'Transactions',
                        description: 'Manajemen Orders & Bills',
                        icon: <ReceiptLongRoundedIcon />,
                        children: [
                            { label: 'Orders', description: 'Daftar Orders', icon: <ListAltRoundedIcon />, forward: `${OPS}/transactions/orders` },
                            { label: 'Bills', description: 'Daftar Tagihan (Bills)', icon: <RequestQuoteRoundedIcon />, forward: `${OPS}/transactions/bills` },
                        ],
                    },
                    {
                        label: 'Shift',
                        description: 'Pengaturan jadwal shift',
                        icon: <AccessTimeRoundedIcon />,
                        forward: `${OPS}/shifts`,
                    },
                    {
                        label: 'Promo',
                        description: 'Pengaturan Kode Promo',
                        icon: <LocalOfferRoundedIcon />,
                        forward: `${OPS}/promo`,
                    },
                ],
            },
            {
                title: 'SLA',
                items: [
                    {
                        label: 'Approvals',
                        description: 'Persetujuan SLA',
                        icon: <HowToRegRoundedIcon />,
                        children: [
                            { label: 'Order Void', description: 'Persetujuan Void', icon: <RemoveShoppingCartRoundedIcon />, forward: `${SLA}/approvals/void` },
                        ],
                    },
                ],
            },
            {
                title: 'Reports',
                items: [
                    {
                        label: 'Reports',
                        description: 'Laporan transaksi & aktivitas',
                        icon: <BarChartRoundedIcon />,
                        forward: `${DASH}/reports`,
                    },
                ],
            },
            {
                title: 'Settings',
                items: [
                    {
                        label: 'Configurations',
                        description: 'Semua konfigurasi sistem',
                        icon: <TuneRoundedIcon />,
                        forward: `${CONFIGS}`,
                        children: [
                            {
                                label: 'Pengguna',
                                description: 'Kelola pengguna, role & permission',
                                icon: <GroupRoundedIcon />,
                                forward: `${CONFIGS}/users`,
                                children: [
                                    { label: 'Users', description: 'Daftar semua pengguna', icon: <GroupRoundedIcon />, forward: `${CONFIGS}/users/list` },
                                    { label: 'Roles', description: 'Atur role pengguna', icon: <ManageAccountsRoundedIcon />, forward: `${CONFIGS}/users/roles` },
                                    { label: 'Permissions', description: 'Hak akses & policy', icon: <SecurityRoundedIcon />, forward: `${CONFIGS}/users/permissions` },
                                ],
                            },
                            {
                                label: 'Perangkat',
                                description: 'Semua Perangkat',
                                icon: <DevicesOtherRoundedIcon />,
                                forward: `${CONFIGS}/devices`,
                                children: [
                                    { label: 'Printers', description: 'Daftar Printer', icon: <PrintRoundedIcon />, forward: `${CONFIGS}/devices/printers` },
                                ],
                            },
                            {
                                label: 'Tipe Order',
                                description: 'Daftar Tipe Order',
                                icon: <ListAltRoundedIcon />,
                                forward: `${CONFIGS}/orders/types`,
                            },
                            {
                                label: 'Metode Pembayaran',
                                description: 'Daftar Metode Pembayaran',
                                icon: <CreditCardRoundedIcon />,
                                forward: `${CONFIGS}/payments/methods`,
                            },
                        ],
                    },
                ],
            },
        ],
        []
    );

    const onNavigate = useCallback(
        (to: string) => {
            if (to === pathname || to === pathname + '/') return;
            router.push(to);
        },
        [router, pathname]
    );

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            <HeaderBar />
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true, wheelPropagation: false }}>
                    <List disablePadding sx={{ py: 0.5 }}>
                        {groups.map((g, gi) => (
                            <Box key={g.title || gi}>
                                {g.title && (
                                    <Divider textAlign="left" sx={{ px: 1.5, py: 0.75 }}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: 10 }}>
                                            {g.title}
                                        </Typography>
                                    </Divider>
                                )}
                                {g.items.map((it) => (
                                    <SidebarItem key={it.label} item={it} level={0} pathname={pathname} onNavigate={onNavigate} />
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
