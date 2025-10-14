/* ======================================================
 * NewCategoryModal — mengikuti pola NewProductModal (UI/UX)
 * ====================================================== */

'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Chip,
    Stack,
    Typography,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, IconButton, Avatar,
    Autocomplete,
} from '@mui/material';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import UploadRounded from '@mui/icons-material/UploadRounded';
import FullscreenExitRounded from '@mui/icons-material/FullscreenExitRounded';
import FullscreenRounded from '@mui/icons-material/FullscreenRounded';
import DarkModeRounded from '@mui/icons-material/DarkModeRounded';
import LightModeRounded from '@mui/icons-material/LightModeRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {useSession} from "../../../../../../../contexts/SessionProviderContext";
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useThemeCharger } from "../../../../../../../contexts/ThemeCharger";
import type { DevicePrinter } from "../../../../../../../types/config/device/device.printer.type";
import SweetAlert2, { SweetAlert2Props } from "react-sweetalert2";

export type NewCategoryModalProps = {
    onCreated?: (created?: any) => void
    triggerLabel?: string
    triggerProps?: React.ComponentProps<typeof Button>
}

export const NewProductsCategoriesModal: React.FC<NewCategoryModalProps> = ({ onCreated, triggerLabel = 'Tambah Kategori', triggerProps }) => {
    const { Session } = useSession();
    const { mode, toggleMode } = useThemeCharger();
    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({ show: false });

    const [open, setOpen] = useState(false);
    const [fullScreen, setFullScreen] = useState(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(true);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [printers, setPrinters] = useState<DevicePrinter[]>([]);
    const [selectedPrinterIds, setSelectedPrinterIds] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const readAsDataUrl = (file: File): Promise<string> => new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = () => rej(new Error('Gagal membaca file'));
        fr.readAsDataURL(file);
    });

    const b64ToBytes = (b64: string): number[] => {
        const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
        const arr = new Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    };

    const clearImage = () => { setImageFile(null); setImagePreview(null); };

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImageFile(f);
        readAsDataUrl(f).then(setImagePreview).catch(() => setImagePreview(null));
    };

    const canSubmit = name.trim().length > 0;

    // ==== Fetch printers saat modal dibuka ====
    const fetchPrinters = useCallback(() => {
        if (!window?.api?.invoke) return;
        window.api
            .invoke<any, { data: DevicePrinter[] }>('api.config.device.printer:read.all', {})
            .then(({ data }) => setPrinters(data ?? []))
            .catch(() => setPrinters([]));
    }, []);

    useEffect(() => { if (open) fetchPrinters(); }, [open, fetchPrinters]);

    const buildPayload = React.useCallback(async () => {
        const payload: any = {
            reference: (Session?.id) ? { id: Session?.id } : undefined,
            branches: (Session?.id) ? Session?.branches : [],
            name: name.trim(),
            description: description.trim() || undefined,
            status: !!status,
            printer: selectedPrinterIds.map(id => ({ id })),
        };
        if (imageFile) {
            const dataUrl = await readAsDataUrl(imageFile);
            const [meta, b64] = dataUrl.split(',');
            const mimetype = meta?.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
            payload.image = { type: 'Buffer', data: b64ToBytes(b64) };
            payload.imageName = imageFile.name;
            payload.imageMime = mimetype;
        } else {
            payload.image = null; // biar backend eksplisit kosong
        }
        return payload;
    }, [ name, description, status, selectedPrinterIds, imageFile]);

    const handleSubmit = React.useCallback(() => {
        if (!window?.api?.invoke) { setError('IPC bridge tidak tersedia'); return; }
        if (!canSubmit) { setError('Nama kategori wajib diisi'); return; }
        setSubmitting(true); setError(null);
        buildPayload()
            .then((payload) => window.api.invoke('api.product.category:create', payload))
            .then((res) => {
                setOpen(false);
                return res;
            })
            .then((res) => {
                setSwalProps({
                    show: true,
                    icon: 'success',
                    title: 'Berhasil Ditambahkan',
                    theme: mode,
                    timer: 2000,
                    text: 'Kategori telah Ditambahkan.',
                    showConfirmButton: false,
                    onResolve: () => {
                        onCreated?.(res);
                    }
                })
            })
            .catch((err: any) => setError(err?.msg || err?.message || 'Gagal membuat kategori'))
            .finally(() => setSubmitting(false));
    },[name, description, status, selectedPrinterIds, imageFile, mode]);

    return (
        <>
            <Button variant="outlined" startIcon={<AddRounded />} onClick={() => setOpen(true)} {...triggerProps}>
                {triggerLabel}
            </Button>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                fullWidth
                maxWidth="lg"
                fullScreen={fullScreen}
                slotProps={{
                    paper: {
                        sx: {
                            height: fullScreen ? '100vh' : '75vh',
                            display: 'flex',
                            bgcolor: 'background.paper',
                            flexDirection: 'column',
                            minWidth: 0,
                        }
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1.5, gap: 1 }}>
                    <Typography variant="h6" fontWeight={800}>Tambah Kategori</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                        <IconButton size="small" onClick={() => setFullScreen(v => !v)}>
                            {fullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={toggleMode} aria-label={(mode === 'dark') ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
                            {(mode === 'dark') ? <DarkModeRounded fontSize="small" /> : <LightModeRounded fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={() => setOpen(false)} aria-label="Tutup">
                            <CloseRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent dividers sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'background.paper', overflow: 'hidden' }}>
                    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, height: '100%' }}>
                        <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }} style={{ width: '100%', height: '100%' }}>
                            <Box sx={{ p: 4 }}>
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                        <Stack alignItems="center" spacing={1.5} sx={{ width: { md: 260 } }}>
                                            <Avatar variant="rounded" src={imagePreview || undefined} sx={{ width: 180, height: 180, borderRadius: 2, bgcolor: 'background.neutral', fontWeight: 700 }}>
                                                {!imagePreview ? 'NO IMG' : null}
                                            </Avatar>
                                            {imagePreview ? (
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" component="label" variant="outlined" startIcon={<UploadRounded />} sx={{ borderRadius: 2 }}>
                                                        Ganti Gambar
                                                        <input hidden accept="image/*" type="file" onChange={onPickFile} />
                                                    </Button>
                                                    <Button size="small" color="error" variant="outlined" onClick={clearImage} startIcon={<DeleteOutlineRounded />} sx={{ borderRadius: 2 }}>
                                                        Hapus
                                                    </Button>
                                                </Stack>
                                            ) : (
                                                <Button variant="outlined" size="small" component="label" startIcon={<UploadRounded />} sx={{ borderRadius: 2 }}>
                                                    Pilih Gambar
                                                    <input hidden accept="image/*" type="file" onChange={onPickFile} />
                                                </Button>
                                            )}
                                        </Stack>

                                        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField label="Nama Kategori" value={name} onChange={e => setName(e.target.value)} required fullWidth />
                                            <TextField label="Deskripsi" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={2} />
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip label={status ? 'Active' : 'Inactive'} color={status ? 'success' : 'default'} variant="outlined" onClick={() => setStatus(s => !s)} sx={{ cursor: 'pointer' }} />
                                                <Typography variant="caption" color="text.secondary">Klik chip untuk toggle status</Typography>
                                            </Stack>

                                            {/* === Multi-select Printer === */}
                                            <Autocomplete
                                                multiple
                                                options={printers}
                                                disableCloseOnSelect
                                                value={printers.filter(p => selectedPrinterIds.includes(p.id))}
                                                onChange={(e, vals) => setSelectedPrinterIds(vals.map(v => v.id))}
                                                getOptionLabel={(opt) => opt?.name ?? ''}
                                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                                renderTags={(value, getTagProps) =>
                                                    value.map((option, index) => (
                                                        <Chip {...getTagProps({ index })} key={option.id} size="small" label={option.name} />
                                                    ))
                                                }
                                                renderInput={(params) => <TextField {...params} label="Assign Printers" placeholder="Cari & pilih printer…" />}
                                                renderOption={(props, option) => {
                                                    const mode = option?.options?.mode ?? '—';
                                                    const ip = option?.options?.ip_address ?? '—';
                                                    const port = option?.options?.port ?? '—';
                                                    return (
                                                        <li {...props} key={option.id}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                                                <Chip size="small" label={mode} />
                                                                <Typography variant="caption" color="text.secondary">{ip}:{port}</Typography>
                                                            </Stack>
                                                        </li>
                                                    );
                                                }}
                                            />
                                        </Stack>
                                    </Stack>

                                    {!!error && (
                                        <Typography variant="body2" color="error.main">{error}</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </PerfectScrollbar>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={() => setOpen(false)}>Batal</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={submitting || !canSubmit}>
                        {submitting ? 'Menyimpan…' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>
            <SweetAlert2 {...swalProps} didClose={() => setSwalProps(prev => ({ ...prev, show: false }))}  />
        </>
    );
};