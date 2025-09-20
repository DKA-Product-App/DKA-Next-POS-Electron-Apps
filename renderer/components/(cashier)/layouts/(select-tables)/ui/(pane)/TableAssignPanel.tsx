'use client';

import * as React from 'react';
import {
    Box, Chip, Divider, Paper, Stack, Tooltip, Typography, IconButton, Button
} from '@mui/material';
import RoomPreferencesRounded from '@mui/icons-material/RoomPreferencesRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import LayersRounded from '@mui/icons-material/LayersRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import AutorenewRounded from '@mui/icons-material/AutorenewRounded';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useSeating, Table2D } from '../../context/SeatingContext';

type TableStatus = 'available' | 'reserved' | 'occupied';

const StatusChip: React.FC<{ status: TableStatus }> = ({ status }) => {
    const map = {
        available: { label: 'Available', color: 'success' as const },
        reserved:  { label: 'Reserved',  color: 'warning' as const },
        occupied:  { label: 'Occupied',  color: 'error'   as const },
    }[status];
    return <Chip size="small" color={map.color} variant="outlined" label={map.label} sx={{ fontWeight: 700 }} />;
};

const EmptyState: React.FC = () => (
    <Paper variant="outlined" sx={(t) => ({
        p: 2, borderRadius: 2, textAlign: 'center',
        bgcolor: t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper,
    })}>
        <Typography fontWeight={900}>Belum ada meja</Typography>
        <Typography variant="body2" color="text.secondary">
            Pilih meja pada denah di sisi kiri untuk melihat detailnya.
        </Typography>
    </Paper>
);

const Row: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={(t) => ({
                width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[200],
                color: t.palette.text.secondary, flexShrink: 0,
            })}>
                {icon}
            </Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Stack>
        <Typography variant="body2" fontWeight={800} sx={{ ml: 2 }} noWrap>{value}</Typography>
    </Stack>
);

const TableAssignPanel: React.FC<{ onSelectTable?: (serverId: string) => void }> = ({ onSelectTable }) => {
    const { selection, floors, refresh, loading, error, tablesByFloor } = useSeating();

    // nama lantai dari context
    const floorName = React.useMemo(() => {
        if (!selection) return '';
        const f = floors.find(x => x.id === selection.floor);
        return f?.name || selection.floor;
    }, [selection, floors]);

    // table yang terpilih (buat ambil serverId)
    const selectedTable: Table2D | null = React.useMemo(() => {
        if (!selection) return null;
        const list = tablesByFloor[selection.floor] || [];
        return list.find(x => x.id === selection.tableId) || null;
    }, [selection, tablesByFloor]);

    const serverId = selectedTable?.serverId || selection?.tableId || '';

    const confirmDisabled = !selection || selection.status !== 'available';

    const handleConfirm = () => {
        if (!selection) return;
        onSelectTable?.(serverId);
        // contoh kalau mau invoke langsung:
        // window.api?.invoke('api.transaction:seat.assign', { tableId: serverId })
        //   .then(() => {/* success UI */})
        //   .catch(() => {/* error UI */});
    };

    return (
        <Paper variant="outlined" sx={(t) => ({
            height: '100%', display: 'flex', flexDirection: 'column',
            borderRadius: 2, bgcolor: t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper,
        })}>
            {/* Header */}
            <Box sx={{ p: 1.25, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight={900} sx={{ flex: 1 }}>Detail Meja</Typography>
                <Tooltip title={loading ? 'Memuat…' : 'Muat ulang'}>
          <span>
            <IconButton size="small" onClick={refresh} disabled={loading}>
              <AutorenewRounded fontSize="small" />
            </IconButton>
          </span>
                </Tooltip>
                {loading ? <Chip size="small" label="Loading" color="info" /> : null}
                {error ? <Chip size="small" label="Gagal load" color="error" /> : null}
            </Box>

            {/* Body */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                    <Stack spacing={1.25} sx={{ p: 1.25 }}>
                        {!selection ? (
                            <EmptyState />
                        ) : (
                            <>
                                {/* Title + status */}
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                    <Typography variant="h6" fontWeight={900}>{selection.label}</Typography>
                                    <StatusChip status={selection.status} />
                                </Stack>

                                <Divider />

                                {/* info singkat */}
                                <Stack spacing={1}>
                                    <Row icon={<GroupRounded fontSize="small" />} label="Kapasitas" value={`${selection.capacity} orang`} />
                                    <Row icon={<LayersRounded fontSize="small" />} label="Lantai" value={floorName || '—'} />
                                    <Row icon={<RoomPreferencesRounded fontSize="small" />} label="ID Meja (REST)" value={serverId || '—'} />
                                </Stack>
                            </>
                        )}
                    </Stack>
                </PerfectScrollbar>
            </Box>

            {/* Footer: tombol pilih meja ini */}
            <Box sx={(t) => ({
                p: 1.25, borderTop: '1px solid', borderColor: 'divider',
                position: 'sticky', bottom: 0,
                backdropFilter: 'saturate(140%) blur(6px)',
                bgcolor: t.palette.mode === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)',
            })}>
                <Tooltip
                    title={
                        !selection ? 'Pilih meja dulu' :
                            selection.status !== 'available' ? 'Meja ini tidak tersedia' :
                                'Pilih meja ini'
                    }
                >
          <span>
            <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={confirmDisabled}
                onClick={handleConfirm}
                startIcon={<CheckCircleRounded />}
                sx={{
                    textTransform: 'none', fontWeight: 800, borderRadius: 1.5,
                    py: 1.25, boxShadow: 'none',
                    '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' },
                    transition: (t) => t.transitions.create(['box-shadow','transform'], { duration: t.transitions.duration.shorter }),
                }}
            >
              Pilih Meja Ini
            </Button>
          </span>
                </Tooltip>
            </Box>
        </Paper>
    );
};

export default TableAssignPanel;
