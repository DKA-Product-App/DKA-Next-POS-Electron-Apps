'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRounded from '@mui/icons-material/RequestQuoteRounded';

import { useLayoutManipulatorResizable } from '../../../../../contexts/LayoutManipulatorResizableContext';
import ShimmerMenuSelectLoading from './../(component)/(transaction)/ui/(loading)/ShimmerMenuSelectLoading';
import {useTabNavigationHandlerContext} from "../(component)/(transaction)/context/TabNavigationHandlerContext";

/* ===== Types & Constants ===== */
type TabDef = { key: string; label: string; icon: React.ReactNode; render: () => React.ReactNode };

const Transaction = dynamic(() => import('./../(component)/(transaction)'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});
const Bills = dynamic(() => import('./../(component)/(bills)'), {
    loading: () => <ShimmerMenuSelectLoading />,
    ssr: false,
});

const ACCENT = '#7c3aed';
const ACCENT_2 = '#a855f7';
const TAB_MIN_WIDTH = 140;   // min lebar tab saat overflow

const TABS: TabDef[] = [
    { key: 'orders', label: 'Pesanan', icon: <ReceiptLongRounded sx={{ fontSize: 18 }} />, render: () => <Transaction /> },
    { key: 'bills',  label: 'Tagihan', icon: <RequestQuoteRounded  sx={{ fontSize: 18 }} />, render: () => <Bills /> },
];

/* ===== Component ===== */
const TabNavigation: React.FC = React.memo(() => {
    const { state, setState } = useTabNavigationHandlerContext();
    const { setLayout } = useLayoutManipulatorResizable();

    const value = Math.max(0, TABS.findIndex(t => t.key === state.active));
    const onChange = (_e: React.SyntheticEvent, v: number) => setState((prev) => {
        return { ...prev, active: TABS[v]?.key ?? 'orders', id: undefined }
    });

    const Current = useMemo(() => TABS[value]?.render ?? (() => <></>), [value]);

    useEffect(() => { setLayout(prev => ({ ...(prev ?? {}), right: <></> })); }, [state.active, setLayout]);

    // ===== Overflow detection =====
    const headerRef = useRef<HTMLDivElement>(null);
    const [isOverflow, setIsOverflow] = useState(false);

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        const calc = () => {
            const containerW = el.clientWidth || 0;
            const needW = TABS.length * TAB_MIN_WIDTH;
            setIsOverflow(needW > containerW);
        };

        const ro = new ResizeObserver(calc);
        ro.observe(el);
        calc();
        return () => ro.disconnect();
    }, []);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ===== Header Tabs (fullWidth jika muat; scrollable + arrows jika overflow) ===== */}
            <Box
                ref={headerRef}
                sx={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                }}
            >
                <Tabs
                    value={value}
                    onChange={onChange}
                    variant={isOverflow ? 'scrollable' : 'fullWidth'}
                    scrollButtons="auto" // <-- panah balik lagi
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
                            pointerEvents: 'none',
                        },

                        // style tombol scroll arrows
                        '& .MuiTabs-scrollButtons': {
                            color: ACCENT,
                            '&.Mui-disabled': { opacity: 0.35 },
                        },

                        '& .MuiTab-root': {
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            gap: 0.5,
                            px: 2,
                            minHeight: 60,

                            // fullWidth jika muat; minWidth saat overflow
                            minWidth: isOverflow ? TAB_MIN_WIDTH : 0,
                            flex: isOverflow ? '0 0 auto' : '1 1 0',
                            maxWidth: 'none',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,

                            textTransform: 'none',
                            fontWeight: 700,
                            color: t.palette.mode === 'dark' ? t.palette.grey[300] : t.palette.grey[800],
                            transition: 'color .2s ease, transform .2s ease, background-color .2s ease',
                            '&.Mui-selected': {
                                color: ACCENT,
                                backgroundColor: t.palette.mode === 'dark' ? 'rgba(124,58,237,0.10)' : 'rgba(168,85,247,0.10)',
                            },
                            '&:hover': { transform: 'translateY(-1px)' },
                        },

                        '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: 0,
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
                                sx={{ '&::before': { content: 'none' } }}
                            />
                        );
                    })}
                </Tabs>
            </Box>

            {/* ===== Body ===== */}
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
