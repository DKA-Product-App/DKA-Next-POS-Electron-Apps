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

// ==== Icons ====
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';

// =====================
// Types
// =====================
type MenuItemNode = {
    label: string;
    description: string;     // 👈 tambah deskripsi
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

    const groups: readonly MenuGroup[] = useMemo(
        () => [
            {
                title: 'General',
                items: [
                    {
                        label: 'Overview',
                        description: 'Ringkasan KPI & statistik utama',
                        icon: <DashboardRoundedIcon />,
                        forward: `${ROOT}/dashboards/overview`,
                    },
                ],
            },
            {
                title: 'Catalog',
                items: [
                    {
                        label: 'Product',
                        description: 'Kelola daftar produk',
                        icon: <Inventory2RoundedIcon />,
                        forward: `${ROOT}/dashboards/products`,
                    },
                    {
                        label: 'Category',
                        description: 'Kelola kategori produk',
                        icon: <CategoryRoundedIcon />,
                        forward: `${ROOT}/dashboards/categories`,
                    },
                ],
            },
            {
                title: 'Operations',
                items: [
                    {
                        label: 'Shift',
                        description: 'Pengaturan jadwal shift',
                        icon: <AccessTimeRoundedIcon />,
                        forward: `${ROOT}/dashboards/shifts`,
                    },
                ],
            },
            {
                title: 'Users & Access',
                items: [
                    {
                        label: 'User Management',
                        description: 'Kelola pengguna, role & permission',
                        icon: <GroupRoundedIcon />,
                        forward: `${ROOT}/dashboards/users`,
                        children: [
                            { label: 'Users', description: 'Daftar semua pengguna', forward: `${ROOT}/dashboards/users` },
                            { label: 'Roles', description: 'Atur role pengguna', icon: <ManageAccountsRoundedIcon />, forward: `${ROOT}/dashboards/users/roles` },
                            { label: 'Permissions', description: 'Hak akses & policy', icon: <SecurityRoundedIcon />, forward: `${ROOT}/dashboards/users/permissions` },
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
                        forward: `${ROOT}/dashboards/reports`,
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
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
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
