'use client';

import * as React from 'react';
import {
    Box, Button, Chip, Divider, Paper, Stack, TextField, Tooltip, Typography
} from '@mui/material';
import TodayRounded from '@mui/icons-material/TodayRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PhoneIphoneRounded from '@mui/icons-material/PhoneIphoneRounded';
import NotesRounded from '@mui/icons-material/NotesRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import DoorFrontRounded from '@mui/icons-material/DoorFrontRounded';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useSeating } from '../../context/SeatingContext';

type Mode = 'walk_in' | 'reserved';

const StatusChip: React.FC<{ status: 'available' | 'reserved' | 'occupied' }> = ({ status }) => {
    const map = {
        available: { label: 'Available', color: 'success' as const },
        reserved:  { label: 'Reserved',  color: 'warning' as const },
        occupied:  { label: 'Occupied',  color: 'error'   as const },
    }[status];
    return <Chip size="small" color={map.color} variant="outlined" label={map.label} sx={{ fontWeight: 700 }} />;
};

const ModeCard: React.FC<{
    active: boolean; icon: React.ReactNode; title: string; desc: string; onClick: () => void;
}> = ({ active, icon, title, desc, onClick }) => (
    <Paper
        role="button"
        aria-pressed={active}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        variant="outlined"
        sx={(t) => ({
            p: 1.25, borderRadius: 2, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 1,
            borderColor: active ? t.palette.primary.main : 'divider',
            bgcolor: active
                ? (t.palette.mode === 'dark' ? 'rgba(25,118,210,0.15)' : 'rgba(25,118,210,0.10)')
                : (t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper),
            transition: t.transitions.create(['transform','box-shadow','background-color','border-color'], { duration: t.transitions.duration.shorter }),
            boxShadow: active ? 3 : 'none',
            '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
        })}
    >
        <Box
            sx={(t) => ({
                width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: active ? t.palette.primary.main : (t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[200]),
                color: active ? t.palette.primary.contrastText : t.palette.text.secondary,
                flexShrink: 0,
            })}
        >
            {icon}
        </Box>
        <Stack minWidth={0}>
            <Typography fontWeight={800} lineHeight={1.2}>{title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{desc}</Typography>
        </Stack>
        {active && <CheckCircleRounded sx={{ ml: 'auto' }} fontSize="small" color="primary" />}
    </Paper>
);

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

const TableAssignPanel: React.FC = () => {
    const { selection } = useSeating();

    const [mode, setMode] = React.useState<Mode>('walk_in');
    const [name, setName] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [note, setNote] = React.useState('');
    const [time, setTime] = React.useState('');

    React.useEffect(() => { setMode('walk_in'); setName(''); setPhone(''); setNote(''); setTime(''); }, [selection?.tableId]);

    const confirmDisabled =
        !selection || selection.status !== 'available' ||
        (mode === 'reserved' && (!name || !time));

    const handleConfirm = () => {
        if (!selection) return;
        const payload = { selection, mode, name, phone, note, time };
        // ganti ke context/API sesuai use case kamu
        // eslint-disable-next-line no-alert
        alert(
            `Meja: ${selection.label} (${selection.floor})\n` +
            `Kapasitas: ${selection.capacity}\n` +
            `Mode: ${mode === 'walk_in' ? 'Datang langsung' : `Dipesan — ${name} @ ${time}`}`
        );
    };

    return (
        <Paper variant="outlined" sx={(t) => ({
            height: '100%', display: 'flex', flexDirection: 'column',
            borderRadius: 2, bgcolor: t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper,
        })}>
            {/* Header */}
            <Box sx={{ p: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={900}>Detail Meja</Typography>
            </Box>

            {/* Body scrollable */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                    <Stack spacing={1.25} sx={{ p: 1.25 }}>
                        {!selection ? (
                            <EmptyState />
                        ) : (
                            <>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                    <Typography variant="h6" fontWeight={900}>{selection.label}</Typography>
                                    <StatusChip status={selection.status} />
                                    <Chip size="small" label={`${selection.capacity} orang`} variant="outlined" sx={{ fontWeight: 700 }} />
                                    <Chip size="small" label={selection.floor === 'L1' ? 'Lantai 1' : 'Lantai 2'} variant="outlined" sx={{ fontWeight: 700 }} />
                                </Stack>

                                <Divider />

                                <Stack spacing={1}>
                                    <Typography variant="subtitle2" fontWeight={900}>Jenis kedatangan</Typography>
                                    <Stack spacing={1}>
                                        <ModeCard
                                            active={mode === 'walk_in'}
                                            icon={<DoorFrontRounded fontSize="small" />}
                                            title="Datang langsung"
                                            desc="Tamu hadir sekarang / tanpa reservasi"
                                            onClick={() => setMode('walk_in')}
                                        />
                                        <ModeCard
                                            active={mode === 'reserved'}
                                            icon={<ScheduleRounded fontSize="small" />}
                                            title="Dipesan (reservasi)"
                                            desc="Tetapkan data pemesan & jadwal kedatangan"
                                            onClick={() => setMode('reserved')}
                                        />
                                    </Stack>
                                </Stack>

                                {mode === 'reserved' && (
                                    <Stack spacing={1}>
                                        <Divider />
                                        <Typography variant="subtitle2" fontWeight={900}>Data reservasi</Typography>

                                        <TextField
                                            size="small" label="Nama pemesan" placeholder="Nama lengkap"
                                            value={name} onChange={(e) => setName(e.target.value)}
                                            InputProps={{ startAdornment: <PersonRounded sx={{ mr: 1, opacity: .6 }} fontSize="small" /> }}
                                        />
                                        <TextField
                                            size="small" label="Nomor HP (opsional)" placeholder="08xx…"
                                            value={phone} onChange={(e) => setPhone(e.target.value)}
                                            InputProps={{ startAdornment: <PhoneIphoneRounded sx={{ mr: 1, opacity: .6 }} fontSize="small" /> }}
                                        />
                                        <TextField
                                            size="small" label="Waktu kedatangan" placeholder="Contoh: 19:30"
                                            value={time} onChange={(e) => setTime(e.target.value)}
                                            InputProps={{ startAdornment: <TodayRounded sx={{ mr: 1, opacity: .6 }} fontSize="small" /> }}
                                        />
                                        <TextField
                                            size="small" label="Catatan (opsional)" placeholder="Permintaan khusus…"
                                            value={note} onChange={(e) => setNote(e.target.value)}
                                            multiline minRows={2}
                                            InputProps={{ startAdornment: <NotesRounded sx={{ mr: 1, opacity: .6 }} fontSize="small" /> }}
                                        />
                                    </Stack>
                                )}
                            </>
                        )}
                    </Stack>
                </PerfectScrollbar>
            </Box>

            {/* Footer sticky */}
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
                                'Tetapkan meja ini'
                    }
                >
          <span>
            <Button
                variant="contained" fullWidth size="large"
                disabled={confirmDisabled} onClick={handleConfirm}
                sx={{
                    textTransform: 'none', fontWeight: 800, borderRadius: 1.5,
                    py: 1.25, boxShadow: 'none',
                    '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' },
                    transition: (t) => t.transitions.create(['box-shadow','transform'], { duration: t.transitions.duration.shorter }),
                }}
            >
              Tetapkan Meja
            </Button>
          </span>
                </Tooltip>
            </Box>
        </Paper>
    );
};

export default TableAssignPanel;
