'use client';

import React, { FC, memo, useMemo, useCallback, useEffect, useState } from 'react';
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

// ==== Icons ====
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
    forward?: string;                // jadikan “key” unik
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
const cleanPath = (p?: string) => (p ?? '').replace(/\/+$/, '');
const isExactPath = (pathname: string, target?: string) => !!target && cleanPath(pathname) === cleanPath(target);
const isDescendantPath = (pathname: string, target?: string) => !!target && cleanPath(pathname).startsWith(cleanPath(target) + '/');

// Rekursif: temukan chain `forward` dari akar → node yang jadi ancestor dari pathname aktif
const findAncestorChain = (nodes: readonly MenuItemNode[], pathname: string): string[] => {
    for (const n of nodes) {
        const key = n.forward ?? `__${n.label}`;
        const selfMatch = isExactPath(pathname, n.forward) || isDescendantPath(pathname, n.forward);
        if (selfMatch) {
            if (n.children?.length) {
                const sub = findAncestorChain(n.children, pathname);
                return [key, ...sub]; // diri + kedalaman
            }
            return [key];
        }
        // kalau diri bukan ancestor, tetap cek anak (untuk kasus parent tidak punya forward, walau kita sarankan punya)
        if (n.children?.length) {
            const sub = findAncestorChain(n.children, pathname);
            if (sub.length) return [key, ...sub];
        }
    }
    return [];
};

// =====================
// Header
// =====================
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
    openKeyByLevel: Record<number, string | null>;
    onToggle: (level: number, key: string) => void;
    onNavigate: (to: string) => void;
};

const SidebarItem: FC<ItemProps> = ({ item, level = 0, pathname, openKeyByLevel, onToggle, onNavigate }) => {
    const hasChildren = Boolean(item.children?.length);
    const key = item.forward ?? `__${item.label}`;
    const active = isExactPath(pathname, item.forward);
    const open = hasChildren && openKeyByLevel[level] === key;

    const handleClick = useCallback(() => {
        if (hasChildren) {
            // Klik parent = toggle open (accordion via parent dengan “satu key per level”)
            onToggle(level, key);
            return;
        }
        if (item.forward) onNavigate(item.forward);
    }, [hasChildren, item.forward, level, key, onToggle, onNavigate]);

    const indent = (level ?? 0) * 1.5;

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
                        primary={<Typography fontWeight={active ? 700 : 600} variant="body2">{item.label}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary" noWrap>{item.description}</Typography>}
                    />

                    {hasChildren ? (open ? <ExpandMoreRoundedIcon fontSize="small" /> : <KeyboardArrowRightRoundedIcon fontSize="small" />) : null}
                </ListItemButton>
            </Tooltip>

            {hasChildren && (
                <Collapse in={open} unmountOnExit>
                    <List disablePadding>
                        {item.children!.map((child) => (
                            <SidebarItem
                                key={child.label}
                                item={child}
                                level={(level || 0) + 1}
                                pathname={pathname}
                                openKeyByLevel={openKeyByLevel}
                                onToggle={onToggle}
                                onNavigate={onNavigate}
                            />
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

    // Base slug helper
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
                    { label: 'Overview', description: 'Ringkasan KPI & statistik utama', icon: <DashboardRoundedIcon />, forward: `${DASH}/overview` },
                ],
            },
            {
                title: 'Data',
                items: [
                    {
                        label: 'Catalog',
                        description: 'Kelola daftar Catalog',
                        icon: <Inventory2RoundedIcon />,
                        forward: `${DASH}/products`, // parent punya forward sebagai key unik
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
                        forward: `${DASH}/data/floors`,
                        children: [
                            { label: 'Meja', description: 'Daftar Meja', icon: <TableRestaurantRoundedIcon />, forward: `${DASH}/data/floors/tables` },
                            { label: 'Lantai', description: 'Daftar Lantai', icon: <LayersRoundedIcon />, forward: `${DASH}/data/floors` },
                        ],
                    },
                    { label: 'Shift', description: 'Pengaturan jadwal shift', icon: <AccessTimeRoundedIcon />, forward: `${DASH}/data/shift` },
                ],
            },
            {
                title: 'Operations',
                items: [
                    {
                        label: 'Transactions',
                        description: 'Manajemen Orders & Bills',
                        icon: <ReceiptLongRoundedIcon />,
                        forward: `${OPS}/transactions`,
                        children: [
                            { label: 'Orders', description: 'Daftar Orders', icon: <ListAltRoundedIcon />, forward: `${OPS}/transactions/orders` },
                            { label: 'Bills', description: 'Daftar Tagihan (Bills)', icon: <RequestQuoteRoundedIcon />, forward: `${OPS}/transactions/bills` },
                        ],
                    },
                    /*{ label: 'Promo', description: 'Pengaturan Kode Promo', icon: <LocalOfferRoundedIcon />, forward: `${OPS}/promo` },*/
                ],
            },
            {
                title: 'SLA',
                items: [
                    {
                        label: 'Approvals',
                        description: 'Persetujuan SLA',
                        icon: <HowToRegRoundedIcon />,
                        forward: `${SLA}/approvals`,
                        children: [
                            { label: 'Order Void', description: 'Persetujuan Void', icon: <RemoveShoppingCartRoundedIcon />, forward: `${SLA}/approvals/void` },
                        ],
                    },
                ],
            },
            {
                title: 'Reports',
                items: [{ label: 'Reports', description: 'Laporan transaksi & aktivitas', icon: <BarChartRoundedIcon />, forward: `${DASH}/reports` }],
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
                                ],
                            },
                            {
                                label: 'Perangkat',
                                description: 'Semua Perangkat',
                                icon: <DevicesOtherRoundedIcon />,
                                forward: `${CONFIGS}/devices`,
                                children: [{ label: 'Printers', description: 'Daftar Printer', icon: <PrintRoundedIcon />, forward: `${CONFIGS}/devices/printers` }],
                            },
                            { label: 'Tipe Order', description: 'Daftar Tipe Order', icon: <ListAltRoundedIcon />, forward: `${CONFIGS}/orders/types` },
                            { label: 'Metode Pembayaran', description: 'Daftar Metode Pembayaran', icon: <CreditCardRoundedIcon />, forward: `${CONFIGS}/payments/methods` },
                        ],
                    },
                ],
            },
        ],
        []
    );

    // ===== Accordion state: satu key per level =====
    const [openKeyByLevel, setOpenKeyByLevel] = useState<Record<number, string | null>>({});

    // Init/sync: buka ancestor chain sesuai pathname aktif (mis. saat reload / back)
    useEffect(() => {
        const allRoots = groups.flatMap((g) => g.items);
        const chain = findAncestorChain(allRoots, pathname);
        const next: Record<number, string | null> = {};
        chain.forEach((k, idx) => (next[idx] = k));
        setOpenKeyByLevel(next);
    }, [pathname, groups]);

    // Toggle handler untuk parent
    const onToggle = useCallback((level: number, key: string) => {
        setOpenKeyByLevel((prev) => {
            const isSame = prev[level] === key;
            if (isSame) {
                // Collapse current level & below
                const copy: Record<number, string | null> = {};
                Object.keys(prev).forEach((lv) => {
                    const nlv = Number(lv);
                    if (nlv < level) copy[nlv] = prev[nlv];
                });
                return copy;
            }
            // Open this key, close siblings at this level and deeper
            const copy: Record<number, string | null> = {};
            Object.keys(prev).forEach((lv) => {
                const nlv = Number(lv);
                if (nlv < level) copy[nlv] = prev[nlv];
            });
            copy[level] = key;
            return copy;
        });
    }, []);

    const onNavigate = useCallback(
        (to: string) => {
            if (!to) return;
            if (to === pathname || to === pathname + '/') return;
            router.push(to);
        },
        [router, pathname]
    );

    return (
        <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
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
                                    <SidebarItem
                                        key={it.label}
                                        item={it}
                                        level={0}
                                        pathname={pathname}
                                        openKeyByLevel={openKeyByLevel}
                                        onToggle={onToggle}
                                        onNavigate={onNavigate}
                                    />
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
