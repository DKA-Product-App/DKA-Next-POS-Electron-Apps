'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded';

import { useLayoutManipulatorResizable } from '../../../../../contexts/LayoutManipulatorResizableContext';
import ShimmerMenuSelectLoading from './../(component)/(transaction)/ui/(loading)/ShimmerMenuSelectLoading';

/* ===== Tab registry (nama + renderer) ===== */
type TabKey = 'orders' | 'bills';
type TabDef = {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    render: () => React.ReactNode;
};

const Transaction = dynamic(() => import('./../(component)/(transaction)'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});

const Bills = dynamic(() => import('./../(component)/(bills)'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});

const ACCENT = '#7c3aed';      // ungu (indigo-600)
const ACCENT_2 = '#a855f7';    // ungu muda (violet-500)

const TABS: TabDef[] = [
    { key: 'orders', label: 'Orders', icon: <ReceiptLongRounded sx={{ fontSize: 18 }} />, render: () => <Transaction /> },
    { key: 'bills',  label: 'Bills',  icon: <RequestQuoteRounded  sx={{ fontSize: 18 }} />, render: () => <Bills /> },
];

const TabNavigation: React.FC = React.memo(() => {
    const [active, setActive] = useState<TabKey>('orders');
    const { setLayout } = useLayoutManipulatorResizable();

    const value = Math.max(0, TABS.findIndex(t => t.key === active));
    const onChange = (_e: React.SyntheticEvent, v: number) => setActive(TABS[v]?.key ?? 'orders');

    const Current = useMemo(() => TABS[value]?.render ?? (() => <></>), [value]);

    useEffect(() => {
        setLayout(prev => ({ ...(prev ?? {}), right: <></> }));
    }, [active, setLayout]);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs
                value={value}
                onChange={onChange}
                variant="fullWidth"
                sx={(t) => ({
                    position: 'relative',
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0, right: 0, top: 0, height: 2,
                        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`,
                        opacity: 0.9,
                    },
                    '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        minHeight: 48,
                        gap: 8,
                        color: t.palette.mode === 'dark' ? t.palette.grey[300] : t.palette.grey[800],
                        transition: 'color .2s ease, transform .2s ease, background-color .2s ease',
                        '&.Mui-selected': {
                            color: ACCENT,
                            backgroundColor: t.palette.mode === 'dark' ? 'rgba(124,58,237,0.10)' : 'rgba(168,85,247,0.10)', // ⬅️ flat kotak
                        },
                        '&:hover': { transform: 'translateY(-1px)' },
                    },
                    // indikator aktif — flat & kotak (no radius)
                    '& .MuiTabs-indicator': {
                        height: 3,
                        borderRadius: 0, // ⬅️ buang rounded
                        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`,
                    },
                })}
            >
                {TABS.map((t, i) => {
                    const isActive = i === value;
                    return (
                        <Tab
                            key={t.key}
                            disableRipple
                            iconPosition="start"
                            icon={
                                <motion.span
                                    initial={false}
                                    animate={{ scale: isActive ? 1.1 : 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                    style={{ display: 'inline-flex', alignItems: 'center' }}
                                >
                                    {t.icon}
                                </motion.span>
                            }
                            label={
                                <motion.span
                                    initial={false}
                                    animate={{ y: isActive ? -1 : 0 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 24 }}
                                    style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 800 }}
                                >
                                    {t.label}
                                </motion.span>
                            }
                            sx={{
                                position: 'relative',
                                // ❌ dulu ada capsule glow rounded; sekarang FLAT kotak → no borderRadius
                                '&::before': { content: 'none' },
                            }}
                        />
                    );
                })}
            </Tabs>

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box sx={{ height: '100%' }} key={`tab-body-${value}`}>
                    {Current()}
                </Box>
            </Box>
        </Box>
    );
});

TabNavigation.displayName = 'TabNavigation';

export default TabNavigation;
