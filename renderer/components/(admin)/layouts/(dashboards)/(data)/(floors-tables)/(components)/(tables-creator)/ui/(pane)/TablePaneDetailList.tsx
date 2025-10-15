'use client';

import * as React from 'react';
import {
    Box, Button, Chip, Paper, Stack, Typography, Divider,
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useTablesCtx } from '../../context/TablesContext';
import {FloorsTables} from "../../../../../../../../../../types/config/data/floors.tables.type";
import {useSession} from "../../../../../../../../../../contexts/SessionProviderContext";

const toServerShape = (s: 'rect' | 'round') => (s === 'rect' ? 'RECTANGLE' : 'CIRCLE');

export function TablePaneDetailList({ onSubmit } : { onSubmit?: (data : FloorsTables[]) => void }) {
    const {
        drafts,
        currentFloorId,
    } = useTablesCtx();
    const { Session } = useSession()

    const list = drafts[currentFloorId] || [];

    const onPublish = async () => {
        if (!list.length || !currentFloorId) return;

        // fallback IPC
        const payload : FloorsTables[] = list.map(t => ({
            reference: (Session?.id) ? { id: Session?.id } : undefined,
            branches: (Session?.id) ? Session?.branches : [],
            floor: { id : currentFloorId },
            code: t.label,
            name: t.label,
            shape: toServerShape(t.shape),
            capacity: t.capacity,
            coordinate: { x: Math.round(t.x), y: Math.round(t.y) },
            dimension: t.shape === 'rect'
                ? { width: Math.round(t.w ?? 100), height: Math.round(t.h ?? 60), rotate: Math.round(t.rot ?? 0) }
                : { width: Math.round((t.r ?? 40) * 2), height: Math.round((t.r ?? 40) * 2), rotate: Math.round(t.rot ?? 0) },
            status: true,
        }));

        onSubmit?.(payload);

    };

    return (
        <Paper variant="outlined" sx={{ height: '100%', p: 1.25, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>Meja Baru (Draft)</Typography>

            <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                <Stack spacing={1.25}>
                    {list.length === 0 ? (
                        <Box sx={{ p: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Belum ada meja baru di lantai ini. Tambahkan dari panel kiri (kotak / bundar), lalu posisikan di kanvas.
                            </Typography>
                        </Box>
                    ) : (
                        list.map(t => {
                            const shapeLabel = t.shape === 'rect' ? 'Kotak' : 'Bundar';
                            const sizeText = t.shape === 'rect'
                                ? `W×H: ${Math.round(t.w ?? 100)}×${Math.round(t.h ?? 60)}`
                                : `R: ${Math.round(t.r ?? 40)}`;
                            const rotText = `${Math.round(t.rot ?? 0)}°`;
                            const posText = `(${Math.round(t.x)}, ${Math.round(t.y)})`;

                            return (
                                <Paper key={t.id} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                                    <Stack spacing={0.75}>
                                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                            <Chip label={shapeLabel} size="small" />
                                            <Typography fontWeight={800}>{t.label || '(tanpa label)'}</Typography>
                                            <Typography variant="body2" color="text.secondary">• {t.capacity} org</Typography>
                                        </Stack>

                                        <Divider flexItem />

                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Chip size="small" variant="outlined" label={`Pos: ${posText}`} />
                                            <Chip size="small" variant="outlined" label={sizeText} />
                                            <Chip size="small" variant="outlined" label={`Rot: ${rotText}`} />
                                            {t.serverId && <Chip size="small" variant="outlined" label={`sid: ${t.serverId}`} />}
                                        </Stack>
                                    </Stack>
                                </Paper>
                            );
                        })
                    )}
                </Stack>
            </PerfectScrollbar>

            <Button
                variant="contained"
                fullWidth
                disabled={!list.length}
                onClick={onPublish}
                sx={{ mt: 'auto', textTransform: 'none', fontWeight: 800 }}
            >
                Simpan / Publish Layout
            </Button>
        </Paper>
    );
}
