'use client';

import * as React from 'react';
import {
    Box, Chip, IconButton, Paper, Popover, Stack, Tooltip, Typography, Button
} from '@mui/material';
import CenterFocusStrongRounded from '@mui/icons-material/CenterFocusStrongRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import RoomPreferencesRounded from '@mui/icons-material/RoomPreferencesRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import PerfectScrollbar from 'react-perfect-scrollbar';
import 'react-perfect-scrollbar/dist/css/styles.css';
import { useTheme } from '@mui/material/styles';
import { TableStatus, Table2D, useSeating } from '../../context/SeatingContext';

/* ===== Utils ===== */
const statusTintId = (s: TableStatus) => s === 'available' ? 'tintAvail' : s === 'reserved' ? 'tintResv' : 'tintOcc';

const countByStatus = (list: Table2D[]) =>
    list.reduce(
        (acc, t) => ({
            total: acc.total + 1,
            available: acc.available + (t.status === 'available' ? 1 : 0),
            reserved: acc.reserved + (t.status === 'reserved' ? 1 : 0),
            occupied: acc.occupied + (t.status === 'occupied' ? 1 : 0),
        }),
        { total: 0, available: 0, reserved: 0, occupied: 0 }
    );

const friendlyFloorName = (id: string) => {
    const n = /(?:LT[-\s]?|L)(\d+)/i.exec(id)?.[1];
    return n ? `Lantai ${Number(n)}` : id;
};

/* ===== Table node ===== */
const TableNode: React.FC<{
    t: Table2D; selected: boolean; onSelect: (id: string) => void;
}> = React.memo(({ t, selected, onSelect }) => {
    const [hover, setHover] = React.useState(false);
    const notSelectable = t.status !== 'available';
    return (
        <g
            className="table-node"
            transform={`translate(${t.x},${t.y}) rotate(${t.rot ?? 0})`}
            style={{ cursor: notSelectable ? 'not-allowed' : 'pointer' }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={(e) => { e.stopPropagation(); notSelectable ? null : onSelect(t.id); }}
        >
            {t.shape === 'round' ? (
                <>
                    <circle cx={0} cy={0} r={t.r ?? 40} fill="url(#wood)" filter="url(#hardShadow)" opacity={notSelectable ? 0.85 : 1} />
                    <circle cx={0} cy={0} r={(t.r ?? 40) - 1} fill="url(#woodVar)" opacity={0.35} />
                    <circle cx={0} cy={0} r={(t.r ?? 40) - 1} fill={`url(#${statusTintId(t.status)})`} />
                    <ellipse cx={-(t.r ?? 40) * 0.25} cy={-(t.r ?? 40) * 0.25} rx={(t.r ?? 40) * 0.7} ry={(t.r ?? 40) * 0.45} fill="url(#gloss)" opacity={hover ? 0.35 : 0.22} />
                    {selected && <circle cx={0} cy={0} r={(t.r ?? 40) - 2} fill="none" stroke="#1976d2" strokeWidth={2} />}
                </>
            ) : (
                <>
                    <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="url(#wood)" filter="url(#hardShadow)" opacity={notSelectable ? 0.85 : 1} />
                    <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="url(#woodVar)" opacity={0.35} />
                    <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill={`url(#${statusTintId(t.status)})`} />
                    <ellipse cx={-(t.w ?? 100) * 0.2} cy={-(t.h ?? 60) * 0.25} rx={(t.w ?? 100) * 0.35} ry={(t.h ?? 60) * 0.35} fill="url(#gloss)" opacity={hover ? 0.35 : 0.22} />
                    {selected && (
                        <rect x={-(t.w ?? 100) / 2} y={-(t.h ?? 60) / 2} width={t.w ?? 100} height={t.h ?? 60} rx={10} fill="none" stroke="#1976d2" strokeWidth={2} />
                    )}
                </>
            )}

            {(hover || selected) && (
                <g transform={`translate(0, ${-(t.shape === 'round' ? (t.r ?? 40) : (t.h ?? 60) / 2) - 18})`}>
                    <rect x={-60} y={-18} width={120} height={22} rx={8} fill="rgba(24,24,28,0.85)" />
                    <text x={0} y={-3} fill="#fff" fontSize="12" fontWeight={800} textAnchor="middle">
                        {t.label} • {t.capacity} org
                    </text>
                </g>
            )}
        </g>
    );
});

/* ===== Main ===== */
const TablePicker2DWidget: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const floorFill = isDark ? '#14171a' : '#f4f6f8';

    // context dinamis
    const { floor, setFloor, selection, setSelection, floors: floorList, tablesByFloor, loading, error, refresh } = useSeating();

    // floors dari REST (List + tabelnya)
    const floors = React.useMemo(
        () => floorList.map(f => ({ id: f.id, name: f.name || f.id, tables: (tablesByFloor[f.id] || []) as Table2D[] })),
        [floorList, tablesByFloor]
    );

    const hasData = floors.length > 0;

    // current floor — auto-select ke lantai pertama saat data muncul
    const [floorLevel, setFloorLevel] = React.useState<string>(floor || '');
    React.useEffect(() => setFloorLevel(floor || ''), [floor]);

    // selection per-floor (dinamis mengikuti floors)
    const [selectedByFloor, setSelectedByFloor] = React.useState<Record<string, string | null>>({});
    React.useEffect(() => {
        const next = floors.reduce<Record<string, string | null>>((acc, f) => ({ ...acc, [f.id]: selectedByFloor[f.id] ?? null }), {});
        setSelectedByFloor(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floors.map(f => f.id).join('|')]);

    // === NEW: Auto-pilih lantai pertama saat data tersedia, jika belum ada pilihan ===
    React.useEffect(() => {
        if (!hasData || floorLevel) return;
        const first = floors[0]?.id;
        first ? (setFloorLevel(first), setFloor(first as any)) : null;
    }, [hasData, floors, floorLevel, setFloor]);

    React.useEffect(() => {
        selection ? setSelectedByFloor(prev => ({ ...prev, [selection.floor as string]: selection.tableId })) : null;
        selection ? setFloorLevel(selection.floor as string) : null;
    }, [selection]);

    const [statusFilter, setStatusFilter] = React.useState<'all' | TableStatus>('all');

    // anchors
    const [statusAnchor, setStatusAnchor] = React.useState<HTMLElement | null>(null);
    const [floorAnchor, setFloorAnchor] = React.useState<HTMLElement | null>(null);

    // data render
    const tables = React.useMemo(
        () => (hasData && floorLevel) ? (floors.find(f => f.id === floorLevel)?.tables ?? []) : [],
        [floors, floorLevel, hasData]
    );
    const currentCounts = React.useMemo(() => countByStatus(tables), [tables]);
    const visibleTables = React.useMemo(
        () => statusFilter === 'all' ? tables : tables.filter(t => t.status === statusFilter),
        [tables, statusFilter]
    );

    // select
    const selectedId = floorLevel ? (selectedByFloor[floorLevel] ?? null) : null;

    // === NEW: debounce untuk refresh agar anti-spam klik ===
    const refreshTimer = React.useRef<number | null>(null);
    const debounceRefresh = () => (
        refreshTimer.current ? window.clearTimeout(refreshTimer.current) : null,
            refreshTimer.current = window.setTimeout(() => { refresh(); refreshTimer.current = null }, 250)
    );

    const onSelectTable = (id: string) => {
        if (!floorLevel) return;
        setSelectedByFloor(prev => ({ ...prev, [floorLevel]: id }));
        const t = tables.find(x => x.id === id)!;
        setSelection({ floor: floorLevel, tableId: t.id, label: t.label, capacity: t.capacity, status: t.status });
        debounceRefresh(); // auto-refresh tiap klik meja
    };

    // full size container
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [size, setSize] = React.useState({ w: 800, h: 480 });
    React.useLayoutEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 800, h: el.clientHeight || 480 }));
        ro.observe(el); return () => ro.disconnect();
    }, []);

    // viewBox & pan/zoom
    const [viewBox, setViewBox] = React.useState({ x: 0, y: 0, w: 800, h: 480 });
    React.useEffect(() => {
        setViewBox(prev => {
            const cx = prev.x + prev.w / 2, cy = prev.y + prev.h / 2;
            return { x: cx - size.w / 2, y: cy - size.h / 2, w: size.w, h: size.h };
        });
    }, [size.w, size.h]);
    React.useEffect(() => { setViewBox(v => ({ ...v, x: 0, y: 0, w: size.w, h: size.h })); }, [floorLevel]);

    const svgRef = React.useRef<SVGSVGElement | null>(null);
    const isPanning = React.useRef(false);
    const panStart = React.useRef<{ x: number; y: number; vx: number; vy: number; pid: number } | null>(null);
    const [spaceDown, setSpaceDown] = React.useState(false);
    const [cursor, setCursor] = React.useState<'default' | 'grab' | 'grabbing'>('default');

    React.useEffect(() => {
        const kd = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(true);
        const ku = (e: KeyboardEvent) => e.code === 'Space' && setSpaceDown(false);
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, []);

    const canPanFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
        const target = e.target as Element;
        const onTable = !!target.closest('.table-node');
        const isMiddle = e.button === 1 || (e.buttons & 4) === 4;
        return isMiddle || spaceDown || !onTable;
    };

    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!canPanFromEvent(e)) return;
        svgRef.current?.setPointerCapture(e.pointerId);
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y, pid: e.pointerId };
        setCursor('grabbing');
    };
    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (!isPanning.current) {
            const target = e.target as Element;
            setCursor(target.closest('.table-node') && !spaceDown ? 'default' : 'grab');
            return;
        }
        const ps = panStart.current, svg = svgRef.current;
        if (!ps || !svg) return;
        const dx = e.clientX - ps.x, dy = e.clientY - ps.y;
        const kx = viewBox.w / (svg.clientWidth || size.w);
        const ky = viewBox.h / (svg.clientHeight || size.h);
        setViewBox(v => ({ ...v, x: ps.vx - dx * kx, y: ps.vy - dy * ky }));
    };
    const finishPan = React.useCallback((pointerId?: number) => {
        if (!isPanning.current) return;
        isPanning.current = false; panStart.current = null; setCursor('grab');
        if (svgRef.current && typeof pointerId === 'number') {
            // @ts-ignore
            svgRef.current.releasePointerCapture && svgRef.current.releasePointerCapture(pointerId);
        }
    }, []);
    const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => finishPan(e.pointerId);
    const onPointerLeave = () => finishPan();
    React.useEffect(() => {
        const onWinPointerUp = () => finishPan();
        window.addEventListener('pointerup', onWinPointerUp, { passive: true });
        return () => window.removeEventListener('pointerup', onWinPointerUp);
    }, [finishPan]);

    const applyZoom = (factor: number) => {
        setViewBox(v => {
            const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
            const nw = Math.max(250, Math.min(3000, v.w * factor));
            const nh = Math.max(150, Math.min(2000, v.h * factor));
            return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
        });
    };

    const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        applyZoom(e.deltaY > 0 ? 1.1 : 0.9);
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                width: '100%', height: '100%', p: 1, borderRadius: 2,
                display: 'flex', flexDirection: 'column',
                bgcolor: (t) => t.palette.mode === 'dark' ? t.palette.grey[900] : t.palette.background.paper,
            }}
        >
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, gap: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <RoomPreferencesRounded fontSize="small" />
                    <Typography fontWeight={900}>
                        Pilih Meja{hasData && floorLevel ? ` — ${friendlyFloorName(floorLevel)}` : ''}
                    </Typography>
                    <Chip size="small" label={selectedId ? selectedId : 'Belum dipilih'} variant="outlined" sx={{ fontWeight: 700 }} />
                    {loading ? <Chip size="small" color="info" label="Loading..." sx={{ ml: 1 }} /> : null}
                    {error ? <Chip size="small" color="error" label="Gagal load" sx={{ ml: 1 }} /> : null}
                    {/* Tombol Refresh DIHAPUS sesuai request */}
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                    {/* Filter status — sembunyikan kalau belum ada data */}
                    {hasData && floorLevel ? (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<TuneRounded />}
                            endIcon={<KeyboardArrowDownRounded />}
                            onClick={(e) => setStatusAnchor(e.currentTarget)}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                        >
                            {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                        </Button>
                    ) : null}

                    {/* Pilih lantai — auto-selected ke item pertama saat data ada */}
                    {hasData ? (
                        <Button
                            size="small"
                            variant="outlined"
                            endIcon={<KeyboardArrowDownRounded />}
                            onClick={(e) => setFloorAnchor(e.currentTarget)}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                        >
                            {floorLevel ? friendlyFloorName(floorLevel) : 'Pilih lantai'}
                        </Button>
                    ) : null}

                    <Tooltip title="Reset view">
                        <IconButton size="small" onClick={() => setViewBox({ x: 0, y: 0, w: size.w, h: size.h })}>
                            <CenterFocusStrongRounded fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Popover Filter Status */}
            <Popover
                open={Boolean(statusAnchor)}
                anchorEl={statusAnchor}
                onClose={() => setStatusAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { p: 1, borderRadius: 2, width: 280 } } }}
            >
                <Box sx={{ height: 220, overflow: 'hidden' }}>
                    <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                        <Stack spacing={1}>
                            {[
                                { key: 'all',       label: 'All',       count: currentCounts.total },
                                { key: 'available', label: 'Available', count: currentCounts.available },
                                { key: 'reserved',  label: 'Reserved',  count: currentCounts.reserved },
                                { key: 'occupied',  label: 'Occupied',  count: currentCounts.occupied },
                            ].map((opt) => {
                                const active = statusFilter === (opt.key as any);
                                return (
                                    <Paper
                                        key={opt.key}
                                        variant={active ? 'elevation' : 'outlined'}
                                        elevation={active ? 3 : 0}
                                        sx={(t) => ({
                                            p: 1, borderRadius: 2, cursor: 'pointer',
                                            bgcolor: active ? (t.palette.mode === 'dark' ? 'rgba(25,118,210,0.15)' : 'rgba(25,118,210,0.10)') : undefined,
                                            '&:hover': { boxShadow: active ? 4 : 2 },
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        })}
                                        onClick={() => { setStatusFilter(opt.key as any); setStatusAnchor(null); }}
                                    >
                                        <Typography fontWeight={900}>{opt.label}</Typography>
                                        <Chip size="small" label={opt.count} sx={{ fontWeight: 700 }} />
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </PerfectScrollbar>
                </Box>
            </Popover>

            {/* Popover Pilih Lantai */}
            <Popover
                open={Boolean(floorAnchor)}
                anchorEl={floorAnchor}
                onClose={() => setFloorAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { p: 1, borderRadius: 2, width: 320 } } }}
            >
                <Box sx={{ height: 260, overflow: 'hidden' }}>
                    <PerfectScrollbar style={{ height: '100%' }} options={{ suppressScrollX: true }}>
                        <Stack spacing={1}>
                            {floors.map((f) => {
                                const c = countByStatus(f.tables);
                                const active = f.id === floorLevel;
                                return (
                                    <Paper
                                        key={f.id}
                                        variant={active ? 'elevation' : 'outlined'}
                                        elevation={active ? 3 : 0}
                                        sx={(t) => ({
                                            p: 1, borderRadius: 2, cursor: 'pointer',
                                            bgcolor: active ? (t.palette.mode === 'dark' ? 'rgba(25,118,210,0.15)' : 'rgba(25,118,210,0.10)') : undefined,
                                            '&:hover': { boxShadow: active ? 4 : 2 },
                                        })}
                                        onClick={() => { setFloorLevel(f.id); setFloor(f.id as any); setFloorAnchor(null); }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography fontWeight={900}>{f.name}</Typography>
                                            <Chip size="small" label={`${c.total} meja`} sx={{ fontWeight: 700 }} />
                                        </Stack>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                            <Chip size="small" color="success" variant="outlined" label={`Available ${c.available}`} />
                                            <Chip size="small" color="warning" variant="outlined" label={`Reserved ${c.reserved}`} />
                                            <Chip size="small" color="error"   variant="outlined" label={`Occupied ${c.occupied}`} />
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </PerfectScrollbar>
                </Box>
            </Popover>

            {/* Canvas */}
            <Box
                ref={containerRef}
                sx={{ position: 'relative', flex: '1 1 0%', minHeight: 0, borderRadius: 1.5, overflow: 'hidden', bgcolor: 'background.default' }}
            >
                <svg
                    ref={svgRef}
                    width="100%" height="100%"
                    viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                    style={{ touchAction: 'none', userSelect: 'none', display: 'block', cursor }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerLeave}
                    onWheel={onWheel}
                >
                    <defs>
                        {/* kayu & efek */}
                        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#a9745b" />
                            <stop offset="100%" stopColor="#8a5a44" />
                        </linearGradient>
                        <pattern id="woodVar" width="24" height="24" patternUnits="userSpaceOnUse">
                            <rect width="24" height="24" fill="none" />
                            <path d="M0 12 H24" stroke="#000" strokeOpacity="0.05" strokeWidth="1"/>
                            <path d="M12 0 V24" stroke="#000" strokeOpacity="0.05" strokeWidth="1"/>
                        </pattern>
                        <radialGradient id="gloss" cx="0.35" cy="0.35" r="0.8">
                            <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                        </radialGradient>
                        <filter id="hardShadow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
                            <feOffset dx="0" dy="1" result="offset"/>
                            <feMerge><feMergeNode in="offset"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>

                        {/* status textures */}
                        <linearGradient id="tintAvail" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%"  stopColor="#2e7d32" stopOpacity="0.10" />
                            <stop offset="100%" stopColor="#1b5e20" stopOpacity="0.14" />
                        </linearGradient>
                        <pattern id="tintResv" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                            <rect width="8" height="8" fill="rgba(255,167,38,0.12)" />
                            <path d="M0 0 L0 8" stroke="rgba(255,167,38,0.45)" strokeWidth="2" />
                        </pattern>
                        <pattern id="tintOcc" width="8" height="8" patternUnits="userSpaceOnUse">
                            <rect width="8" height="8" fill="rgba(211,47,47,0.18)" />
                            <path d="M0 0 L8 8" stroke="rgba(183,28,28,0.45)" strokeWidth="1.5" />
                            <path d="M8 0 L0 8" stroke="rgba(183,28,28,0.45)" strokeWidth="1.5" />
                        </pattern>
                    </defs>

                    {/* Lantai polos */}
                    <rect x={viewBox.x - 40} y={viewBox.y - 40} width={viewBox.w + 80} height={viewBox.h + 80} fill={floorFill} />
                    <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="none" stroke="#000" strokeOpacity={isDark ? 0.12 : 0.10} />

                    {/* Tables */}
                    {visibleTables.map(t => (
                        <TableNode key={t.id} t={t} selected={t.id === selectedId} onSelect={onSelectTable} />
                    ))}
                </svg>

                {/* zoom controls */}
                <Stack spacing={1} direction="row" sx={{ position: 'absolute', right: 8, bottom: 8 }}>
                    <Tooltip title="Zoom out"><IconButton size="small" onClick={() => applyZoom(1.15)}>–</IconButton></Tooltip>
                    <Tooltip title="Zoom in"><IconButton size="small" onClick={() => applyZoom(0.85)}>+</IconButton></Tooltip>
                </Stack>
            </Box>
        </Paper>
    );
};

export default TablePicker2DWidget;
