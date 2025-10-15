'use client';

import * as React from 'react';
import {
    Box, Paper, Stack, IconButton, Tooltip, Chip, Divider, TextField, MenuItem, Typography,
} from '@mui/material';

import CropSquareRounded from '@mui/icons-material/CropSquareRounded';
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import CenterFocusStrongRounded from '@mui/icons-material/CenterFocusStrongRounded';
import ZoomInMapRounded from '@mui/icons-material/ZoomInMapRounded';
import ZoomOutMapRounded from '@mui/icons-material/ZoomOutMapRounded';
import LayersRounded from '@mui/icons-material/LayersRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';

import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';

import { useTablesCtx, type TableDraft as CtxTableDraft } from './../../context/TablesContext';
import {useThemeCharger} from "../../../../../../../../../../contexts/ThemeCharger";

type Shape = 'rect' | 'round';
export type TableDraft = CtxTableDraft;

export type FloorDraft = {
    id: string;
    name?: string;
    tables: TableDraft[];
};

const uid = () => crypto.randomUUID();
const snap = (v: number, grid = 10) => Math.round(v / grid) * grid;

/** ==== Mapper server → draft ==== */
type ServerFloor = {
    id: string; code: string; name: string; tables: ServerTable[];
};
type ServerTable = {
    id: string;
    code: string;
    name: string;
    shape: 'RECTANGLE' | 'CIRCLE' | 'ROUND' | string;
    capacity: number;
    coordinate: { x: number; y: number };
    dimension: { width: number; height: number; rotate: number };
};

const shapeMap = (s: string): Shape => (s === 'RECTANGLE' ? 'rect' : 'round');

const mapServerFloors = (data: ServerFloor[]): FloorDraft[] =>
    (data || []).map(f => ({
        id: f.id,
        name: f.name || f.code,
        tables: (f.tables || []).map<TableDraft>(t => {
            const isRect = shapeMap(t.shape) === 'rect';
            const w = Math.max(40, t.dimension?.width || 100);
            const h = Math.max(30, t.dimension?.height || 60);
            const r = Math.max(20, Math.round(((t.dimension?.width || 80) + (t.dimension?.height || 80)) / 4));
            return {
                id: t.id,
                serverId: t.id,
                label: t.name || t.code || 'Table',
                capacity: Number.isFinite(t.capacity) ? t.capacity : 4,
                shape: isRect ? 'rect' : 'round',
                x: Number.isFinite(t.coordinate?.x) ? t.coordinate.x : 200,
                y: Number.isFinite(t.coordinate?.y) ? t.coordinate.y : 160,
                w: isRect ? w : undefined,
                h: isRect ? h : undefined,
                r: isRect ? undefined : r,
                rot: Number.isFinite(t.dimension?.rotate) ? t.dimension.rotate : 0,
                locked: true,
            };
        }),
    }));

// shallow equal utk array drafts (hindari sync berulang)
const draftsShallowEqual = (a: TableDraft[], b: TableDraft[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const x = a[i], y = b[i];
        if (
            x.id !== y.id ||
            x.shape !== y.shape ||
            x.label !== y.label ||
            x.capacity !== y.capacity ||
            x.x !== y.x || x.y !== y.y ||
            x.w !== y.w || x.h !== y.h || x.r !== y.r ||
            x.rot !== y.rot || x.locked !== y.locked
        ) return false;
    }
    return true;
};

export default function TableLayoutCreator({ gridSize = 10 }: { gridSize?: number }) {
    const { mode } = useThemeCharger();
    const isDark = mode === 'dark';
    const COLORS = React.useMemo(() => ({
        bg: isDark ? '#0e1117' : '#f4f6f8',
        border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
        grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
        wood1: isDark ? '#b7896a' : '#d8b6a1',
        wood2: isDark ? '#93674d' : '#bf8e70',
        glossOpacity: isDark ? 0.18 : 0.22,
        lockedStroke: isDark ? '#b0b0b0' : '#9e9e9e',
        badgeBg: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(24,24,28,0.85)',
        badgeText: '#fff',
    }), [isDark]);

    const {
        setCurrentFloorId,        // <-- hati2 panggilnya
        syncDrafts,               // <-- sinkron ke kanan
        selected: selGlobal,
        setSelected: setSelGlobal
    } = useTablesCtx();

    const [floors, setFloors] = React.useState<FloorDraft[]>([]);
    const [floorId, setFloorId] = React.useState<string>('');
    const current = React.useMemo(
        () => floors.find(f => f.id === floorId) || floors[0],
        [floors, floorId]
    );

    const selected = selGlobal;
    const setSelected = setSelGlobal;

    // ref utk guard panggilan yang harusnya hanya sekali
    const lastDraftsRef = React.useRef<Record<string, TableDraft[]>>({});
    const lastFloorIdSentRef = React.useRef<string>('');     // ← guard setCurrentFloorId

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    /** ===== Load floors via IPC (STABIL, no deps) ===== */
    const readFloors = React.useCallback(() => {
        setLoading(true);
        setError(null);
        const runner = window.api?.invoke?.('api.config.data.floors:read.all', {});
        return Promise.resolve(runner)
            .then((res: any) => {
                const ok = !!res?.status && Array.isArray(res?.data);
                const mapped = ok ? mapServerFloors(res.data as ServerFloor[]) : [];
                setFloors(mapped);
                // pilih lantai pertama jika belum ada
                setFloorId(prev => prev || mapped[0]?.id || '');
                setSelected([]); // clear selection

                if (!ok) setError(typeof res?.msg === 'string' ? res.msg : 'Format respons tidak valid');

                // sinkron awal utk lantai awal SAJA (tanpa memanggil setter lain)
                const fid = mapped[0]?.id;
                if (fid) {
                    const cur = mapped.find(f => f.id === fid) || mapped[0];
                    const drafts = (cur?.tables || []).filter(t => !t.locked);
                    lastDraftsRef.current[fid] = drafts;
                    // jangan panggil syncDrafts di sini — biar effect di bawah yg urus setelah setFloorId benar2 settled
                }
            })
            .catch((e: any) => setError(typeof e?.message === 'string' ? e.message : 'Gagal memuat data lantai'))
            .finally(() => setLoading(false));
    }, []); // ← penting: no deps

    React.useEffect(() => { readFloors(); }, [readFloors]);

    /** ===== Effect: kirim floorId ke context HANYA jika berubah ===== */
    React.useEffect(() => {
        if (!floorId) return;
        if (lastFloorIdSentRef.current !== floorId) {
            lastFloorIdSentRef.current = floorId;
            setCurrentFloorId(floorId);           // ← tidak akan loop
        }
    }, [floorId, setCurrentFloorId]);

    /** ===== Effect: sinkron drafts ke context, dengan guard deep-shallow ===== */
    React.useEffect(() => {
        if (!floorId) return;
        const cur = floors.find(f => f.id === floorId);
        const drafts = (cur?.tables || []).filter(t => !t.locked);
        const last = lastDraftsRef.current[floorId] || [];
        if (!draftsShallowEqual(drafts, last)) {
            lastDraftsRef.current[floorId] = drafts;
            syncDrafts(floorId, drafts);
        }
    }, [floors, floorId, syncDrafts]);

    /** ===== Canvas sizing / zoom / pan ===== */
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const [size, setSize] = React.useState({ w: 900, h: 540 });
    const [viewBox, setViewBox] = React.useState({ x: 0, y: 0, w: 900, h: 540 });
    const [spaceDown, setSpaceDown] = React.useState(false);
    const [cursor, setCursor] = React.useState<'default' | 'grab' | 'grabbing' | 'not-allowed' | 'move'>('default');

    React.useLayoutEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 900, h: el.clientHeight || 540 }));
        ro.observe(el); return () => ro.disconnect();
    }, []);
    React.useEffect(() => {
        setViewBox(v => {
            const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
            return { x: cx - size.w / 2, y: cy - size.h / 2, w: size.w, h: size.h };
        });
    }, [size.w, size.h]);

    React.useEffect(() => {
        const kd = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(true);
        const ku = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(false);
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, []);

    const isPanning = React.useRef(false);
    const panStart = React.useRef<{ x: number; y: number; vx: number; vy: number; pid: number } | null>(null);

    const applyZoom = (factor: number) =>
        setViewBox(v => {
            const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
            const nw = Math.max(250, Math.min(3000, v.w * factor));
            const nh = Math.max(150, Math.min(2000, v.h * factor));
            return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
        });

    /** ===== DRAG state + RAF throttle ===== */
    const dragRef = React.useRef<{ ids: string[]; ox: number; oy: number; tx: number; ty: number } | null>(null);
    const rafRef = React.useRef<number | null>(null);
    const pendingMove = React.useRef<{ ids: string[], nx: number, ny: number } | null>(null);

    const tables = current?.tables ?? [];

    /** ===== Satu-satunya jalur update + eager sync ===== */
    const setTablesSync = React.useCallback((updater: (prev: TableDraft[]) => TableDraft[]) => {
        const fid = floorId || current?.id || '';
        if (!fid) return;
        setFloors(prev => prev.map(f => {
            if (f.id !== (current?.id || floorId)) return f;
            const next = updater(f.tables);
            // update cache + sync drafts bila berubah
            const drafts = next.filter(t => !t.locked);
            const last = lastDraftsRef.current[fid] || [];
            if (!draftsShallowEqual(drafts, last)) {
                lastDraftsRef.current[fid] = drafts;
                syncDrafts(fid, drafts);
            }
            return { ...f, tables: next };
        }));
    }, [current?.id, floorId, syncDrafts]);

    /** ===== Actions ===== */
    const addTable = (shape: Shape) => {
        const base: TableDraft = shape === 'rect'
            ? { id: uid(), shape, label: 'T-NEW', capacity: 4, x: 200, y: 160, w: 120, h: 70, rot: 0 }
            : { id: uid(), shape, label: 'T-NEW', capacity: 4, x: 200, y: 160, r: 45, rot: 0 };
        setTablesSync(prev => prev.concat(base));
        setSelected([base.id]);
    };

    const duplicate = () => {
        const clones = tables
            .filter(t => selected.includes(t.id) && !t.locked)
            .map(t => ({ ...t, id: uid(), x: t.x + 24, y: t.y + 24 }));
        if (!clones.length) return;
        setTablesSync(prev => prev.concat(clones));
        setSelected(clones.map(c => c.id));
    };

    const removeSelected = () => {
        if (!selected.length) return;
        const deletable = tables.filter(t => selected.includes(t.id) && !t.locked).map(t => t.id);
        if (!deletable.length) return;
        setTablesSync(prev => prev.filter(t => !deletable.includes(t.id)));
        setSelected([]);
    };

    /** ===== Keyboard ===== */
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!current || !selected.length) return;
            const ids = tables.filter(t => selected.includes(t.id) && !t.locked).map(t => t.id);
            if (!ids.length) return;

            const step = e.shiftKey ? gridSize * 2 : gridSize;
            const applyNudge = (dx: number, dy: number) =>
                setTablesSync(prev => prev.map(t => ids.includes(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t));
            const applyRotate = (d: number) =>
                setTablesSync(prev => prev.map(t => ids.includes(t.id) ? { ...t, rot: (t.rot ?? 0) + d } : t));

            if (e.key === 'Delete' || e.key === 'Backspace') removeSelected();
            if (e.key === 'ArrowUp') applyNudge(0, -step);
            if (e.key === 'ArrowDown') applyNudge(0, step);
            if (e.key === 'ArrowLeft') applyNudge(-step, 0);
            if (e.key === 'ArrowRight') applyNudge(step, 0);
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') duplicate();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') applyRotate(e.shiftKey ? -15 : 15);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [current, selected, tables, gridSize, setTablesSync]);

    /** ===== SVG: pan & drag di satu tempat ===== */
    const nodeFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
        const el = (e.target as Element).closest('g.creator-node') as SVGGElement | null;
        if (!el) return null;
        const id = el.getAttribute('data-id') || '';
        const locked = el.getAttribute('data-locked') === 'true';
        return { id, locked };
    };

    const onSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        const midBtn = e.button === 1 || (e.buttons & 4) === 4;
        const node = nodeFromEvent(e);

        if (node && !node.locked && !midBtn && !spaceDown) {
            const t = tables.find(x => x.id === node.id); if (!t) return;
            if (!selected.includes(node.id)) setSelected(e.shiftKey ? [...selected, node.id] : [node.id]);
            svgRef.current?.setPointerCapture(e.pointerId);
            dragRef.current = { ids: selected.includes(node.id) ? selected : [node.id], ox: e.clientX, oy: e.clientY, tx: t.x, ty: t.y };
            setCursor('grabbing');
            return;
        }

        // pan
        svgRef.current?.setPointerCapture(e.pointerId);
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y, pid: e.pointerId };
        setCursor('grabbing');
    };

    const onSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (dragRef.current) {
            const d = dragRef.current;
            const svg = svgRef.current; if (!svg) return;
            const kx = viewBox.w / (svg.clientWidth || size.w);
            const ky = viewBox.h / (svg.clientHeight || size.h);
            const nx = d.tx + (e.clientX - d.ox) * kx;
            const ny = d.ty + (e.clientY - d.oy) * ky;

            pendingMove.current = { ids: d.ids, nx, ny };
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                    const p = pendingMove.current; rafRef.current = null;
                    if (!p) return;
                    setTablesSync(prev => prev.map(t =>
                        (p.ids.includes(t.id) && !t.locked) ? { ...t, x: p.nx, y: p.ny } : t
                    ));
                });
            }
            return;
        }

        if (isPanning.current) {
            const ps = panStart.current, svg = svgRef.current;
            if (!ps || !svg) return;
            const dx = e.clientX - ps.x, dy = e.clientY - ps.y;
            const kx = viewBox.w / (svg.clientWidth || size.w);
            const ky = viewBox.h / (svg.clientHeight || size.h);
            setViewBox(v => ({ ...v, x: ps.vx - dx * kx, y: ps.vy - dy * ky }));
            return;
        }

        const node = nodeFromEvent(e);
        setCursor(node ? (node.locked ? 'not-allowed' : 'move') : 'grab');
    };

    const onSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
        if (dragRef.current) {
            const d = dragRef.current; dragRef.current = null;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null; pendingMove.current = null;

            setTablesSync(prev => prev.map(t =>
                (d.ids.includes(t.id) && !t.locked) ? { ...t, x: snap(t.x, gridSize), y: snap(t.y, gridSize) } : t
            ));

            svgRef.current?.releasePointerCapture?.(e.pointerId as any);
            setCursor('grab');
            return;
        }

        if (isPanning.current) {
            isPanning.current = false; panStart.current = null; setCursor('grab');
            svgRef.current?.releasePointerCapture?.(e.pointerId as any);
        }
    };

    const onSvgPointerLeave = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null; pendingMove.current = null;
        dragRef.current = null;
        isPanning.current = false; panStart.current = null;
        setCursor('grab');
    };

    /** ===== Inspector mini (sinkron real-time) ===== */
    const selectedTable = React.useMemo(
        () => (selected.length === 1 ? tables.find(t => t.id === selected[0]) : undefined),
        [tables, selected]
    );
    const canEditSelected = !!selectedTable && !selectedTable.locked;
    const updateSelectedById = React.useCallback((id: string, patch: Partial<TableDraft>) => {
        setTablesSync(prev => prev.map(t => (t.id === id && !t.locked) ? { ...t, ...patch } : t));
    }, [setTablesSync]);

    return (
        <Paper variant="outlined" sx={{ width: '100%', height: '100%', p: 1, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar (NO SAVE di sini) */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                <Chip icon={<LayersRounded />} label={current?.name || current?.id || (loading ? 'Memuat…' : '—')} variant="outlined" />
                <TextField
                    size="small" select label="Lantai" value={floorId}
                    onChange={(e) => { setFloorId(e.target.value); setSelected([]); }}
                    sx={{ minWidth: 160 }}
                >
                    {floors.map(f => <MenuItem key={f.id} value={f.id}>{f.name || f.id}</MenuItem>)}
                </TextField>

                <Tooltip title="Refresh dari server">
                    <span><IconButton onClick={readFloors} disabled={loading}><RefreshRounded /></IconButton></span>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Tambah meja kotak">
                    <IconButton onClick={() => addTable('rect')}><CropSquareRounded /></IconButton>
                </Tooltip>
                <Tooltip title="Tambah meja bundar">
                    <IconButton onClick={() => addTable('round')}><RadioButtonUncheckedRounded /></IconButton>
                </Tooltip>
                <Tooltip title="Duplikasi (Ctrl+D)">
                    <span><IconButton disabled={!selected.length || !selected.some(id => !tables.find(t => t.id === id)?.locked)} onClick={duplicate}><ContentCopyRounded /></IconButton></span>
                </Tooltip>
                <Tooltip title="Hapus (Del)">
                    <span><IconButton disabled={!selected.length || !selected.some(id => !tables.find(t => t.id === id)?.locked)} onClick={removeSelected}><DeleteOutlineRounded /></IconButton></span>
                </Tooltip>

                <Divider orientation="vertical" flexItem />

                <Tooltip title="Zoom out"><IconButton onClick={() => applyZoom(1.15)}><ZoomOutMapRounded /></IconButton></Tooltip>
                <Tooltip title="Zoom in"><IconButton onClick={() => applyZoom(0.85)}><ZoomInMapRounded /></IconButton></Tooltip>
                <Tooltip title="Reset view"><IconButton onClick={() => setViewBox({ x: 0, y: 0, w: size.w, h: size.h })}><CenterFocusStrongRounded /></IconButton></Tooltip>
            </Stack>

            {/* Body */}
            <Box sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
                <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                    <Box ref={containerRef} sx={{ position: 'relative', height: 560 }}>
                        <svg
                            ref={svgRef}
                            width="100%" height="100%"
                            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                            style={{ touchAction: 'none', userSelect: 'none', display: 'block', cursor }}
                            onPointerDown={onSvgPointerDown}
                            onPointerMove={onSvgPointerMove}
                            onPointerUp={onSvgPointerUp}
                            onPointerLeave={onSvgPointerLeave}
                            onWheel={(e) => { e.preventDefault(); applyZoom(e.deltaY > 0 ? 1.1 : 0.9); }}
                        >
                            <defs>
                                <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={COLORS.wood1}/><stop offset="100%" stopColor={COLORS.wood2}/>
                                </linearGradient>
                                <pattern id="woodVar" width="24" height="24" patternUnits="userSpaceOnUse">
                                    <rect width="24" height="24" fill="none"/>
                                    <path d="M0 12 H24" stroke="#000" strokeOpacity={isDark ? 0.06 : 0.035} strokeWidth="1"/>
                                    <path d="M12 0 V24" stroke="#000" strokeOpacity={isDark ? 0.06 : 0.035} strokeWidth="1"/>
                                </pattern>
                                <radialGradient id="gloss" cx="0.35" cy="0.35" r="0.8">
                                    <stop offset="0%" stopColor="#fff" stopOpacity={COLORS.glossOpacity}/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
                                </radialGradient>
                                <filter id="hardShadow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.25" result="blur"/>
                                    <feOffset dx="0" dy="1" result="offset"/>
                                    <feMerge><feMergeNode in="offset"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                            </defs>

                            {/* floor bg + border */}
                            <rect x={viewBox.x - 40} y={viewBox.y - 40} width={viewBox.w + 80} height={viewBox.h + 80} fill={COLORS.bg}/>
                            <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="none" stroke={COLORS.border}/>

                            {/* grid */}
                            {Array.from({ length: Math.ceil(viewBox.w / gridSize) + 2 }).map((_, i) => (
                                <line key={`gx-${i}`} x1={viewBox.x + i * gridSize} y1={viewBox.y}
                                      x2={viewBox.x + i * gridSize} y2={viewBox.y + viewBox.h} stroke={COLORS.grid}/>
                            ))}
                            {Array.from({ length: Math.ceil(viewBox.h / gridSize) + 2 }).map((_, i) => (
                                <line key={`gy-${i}`} y1={viewBox.y + i * gridSize} x1={viewBox.x}
                                      y2={viewBox.y + i * gridSize} x2={viewBox.x + viewBox.w} stroke={COLORS.grid}/>
                            ))}

                            {/* tables */}
                            {(current?.tables ?? []).map(t => (
                                <g
                                    key={t.id}
                                    className={`creator-node${t.locked ? ' locked' : ''}`}
                                    data-id={t.id}
                                    data-locked={t.locked ? 'true' : 'false'}
                                    transform={`translate(${t.x},${t.y}) rotate(${t.rot ?? 0})`}
                                    style={{ cursor: t.locked ? 'not-allowed' : 'move' }}
                                >
                                    {t.shape === 'round' ? (
                                        <>
                                            <circle cx={0} cy={0} r={(t.r ?? 40)} fill="url(#wood)" filter="url(#hardShadow)"/>
                                            <circle cx={0} cy={0} r={(t.r ?? 40) - 1} fill="url(#woodVar)" opacity={0.35}/>
                                            <ellipse cx={-(t.r ?? 40) * 0.25} cy={-(t.r ?? 40) * 0.25} rx={(t.r ?? 40) * 0.7} ry={(t.r ?? 40) * 0.45} fill="url(#gloss)"/>
                                            {t.locked
                                                ? <circle cx={0} cy={0} r={(t.r ?? 40) - 2} fill="none" stroke={COLORS.lockedStroke} strokeDasharray="4 3" strokeWidth={2}/>
                                                : (selected.includes(t.id) && <circle cx={0} cy={0} r={(t.r ?? 40) - 2} fill="none" stroke="#1976d2" strokeWidth={2}/>)
                                            }
                                        </>
                                    ) : (
                                        <>
                                            <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="url(#wood)" filter="url(#hardShadow)"/>
                                            <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="url(#woodVar)" opacity={0.35}/>
                                            <ellipse cx={-(t.w ?? 100) * 0.2} cy={-(t.h ?? 60) * 0.25} rx={(t.w ?? 100) * 0.35} ry={(t.h ?? 60) * 0.35} fill="url(#gloss)"/>
                                            {t.locked
                                                ? <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="none" stroke={COLORS.lockedStroke} strokeDasharray="4 3" strokeWidth={2}/>
                                                : (selected.includes(t.id) && <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="none" stroke="#1976d2" strokeWidth={2}/>)
                                            }
                                        </>
                                    )}

                                    {/* Badge label */}
                                    <g transform={`translate(0, ${-(t.shape === 'round' ? (t.r ?? 40) : (t.h ?? 60) / 2) - 18})`}>
                                        <rect x={-70} y={-18} width={140} height={22} rx={8} fill={COLORS.badgeBg}/>
                                        <text x={0} y={-3} fill={COLORS.badgeText} fontSize="12" fontWeight={800} textAnchor="middle">
                                            {t.label} • {t.capacity} org{t.locked ? ' • locked' : ''}
                                        </text>
                                    </g>
                                </g>
                            ))}
                        </svg>
                    </Box>
                </PerfectScrollbar>
            </Box>

            {/* Inspector mini */}
            <Paper variant="outlined" sx={{ mt: 1, p: 1.25, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Chip label={selected.length ? `${selected.length} meja dipilih` : (loading ? 'Memuat…' : 'Pilih meja untuk edit')} />
                    {error ? <Typography color="error" sx={{ ml: 1 }}>{error}</Typography> : null}

                    {(() => {
                        const st = selected.length === 1 ? tables.find(t => t.id === selected[0]) : undefined;
                        if (!st || st.locked) return null;
                        return (
                            <>
                                <TextField
                                    key={st.id + '-label'}
                                    size="small" label="Label"
                                    value={st.label ?? ''}
                                    onChange={(e) => updateSelectedById(st.id, { label: e.target.value })}
                                />
                                <TextField
                                    key={st.id + '-cap'}
                                    size="small" type="number" label="Capacity" sx={{ width: 120 }}
                                    value={st.capacity ?? 0}
                                    onChange={(e) => updateSelectedById(st.id, { capacity: Number(e.target.value || 0) })}
                                />
                                <TextField
                                    key={st.id + '-rot'}
                                    size="small" type="number" label="Rotate (°)" sx={{ width: 120 }}
                                    value={st.rot ?? 0}
                                    onChange={(e) => updateSelectedById(st.id, { rot: Number(e.target.value || 0) })}
                                />
                                {st.shape === 'rect' ? (
                                    <>
                                        <TextField
                                            key={st.id + '-w'}
                                            size="small" type="number" label="Width" sx={{ width: 120 }}
                                            value={st.w ?? 0}
                                            onChange={(e) => updateSelectedById(st.id, { w: Number(e.target.value || 0) })}
                                        />
                                        <TextField
                                            key={st.id + '-h'}
                                            size="small" type="number" label="Height" sx={{ width: 120 }}
                                            value={st.h ?? 0}
                                            onChange={(e) => updateSelectedById(st.id, { h: Number(e.target.value || 0) })}
                                        />
                                    </>
                                ) : (
                                    <TextField
                                        key={st.id + '-r'}
                                        size="small" type="number" label="Radius" sx={{ width: 120 }}
                                        value={st.r ?? 0}
                                        onChange={(e) => updateSelectedById(st.id, { r: Number(e.target.value || 0) })}
                                    />
                                )}
                            </>
                        );
                    })()}
                </Stack>
            </Paper>
        </Paper>
    );
}
