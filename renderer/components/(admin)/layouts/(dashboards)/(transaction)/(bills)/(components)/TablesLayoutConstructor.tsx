'use client';

import * as React from 'react';
import {
    Box,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    Menu,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import FilterListRounded from '@mui/icons-material/FilterListRounded';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRounded from '@mui/icons-material/ArrowDownwardRounded';
import ClearRounded from '@mui/icons-material/ClearRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';

/* =========================
   Public Types
========================= */
export type HeaderFilter =
    | { type: 'text' }
    | { type: 'select'; options: { label: string; value: string }[] };

export type Column<T> = {
    key: keyof T | string;
    label: string;
    width?: number;
    minWidth?: number;
    align?: 'left' | 'right' | 'center';
    sortable?: boolean;
    resizable?: boolean;
    hidden?: boolean;
    headerFilter?: HeaderFilter;
    render?: (row: T) => React.ReactNode;
};

export type DataTableProps<T> = {
    columns: Column<T>[];
    rows: T[];
    enableSelection?: boolean;
    rowsPerPageOptions?: number[];
    initialRowsPerPage?: number;
    onSelectionChange?: (ids: (string | number)[]) => void;
};

/* =========================
   Utilities (exported)
========================= */
export function useNonPassiveWheel(ref: React.RefObject<HTMLElement>) {
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            const atTop = el.scrollTop <= 0;
            const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

            if (!((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0))) {
                el.scrollTop += e.deltaY;
                e.preventDefault();
                e.stopPropagation();
            }
        };

        el.addEventListener('wheel', onWheel, { passive: false, capture: true });
        return () => {
            el.removeEventListener('wheel', onWheel, { capture: true } as any);
        };
    }, [ref]);
}

/* =========================
   Local helpers
========================= */
const includesInsensitive = (s: any, q: string) =>
    ('' + (s ?? '')).toLowerCase().includes(q.toLowerCase());

const sortByKey = <T,>(key: string, dir: 'asc' | 'desc') => (a: T, b: T) => {
    const va = (a as any)?.[key];
    const vb = (b as any)?.[key];
    const norm = (v: any) =>
        typeof v === 'number' ? v : ('' + (v ?? '')).toLowerCase?.() ?? v;
    const na = norm(va);
    const nb = norm(vb);
    const cmp = na < nb ? -1 : na > nb ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
};

/* =========================
   DataTable (exported)
========================= */
export function DataTable<T extends Record<string, any>>({
                                                             columns,
                                                             rows,
                                                             enableSelection = true,
                                                             rowsPerPageOptions = [10, 15, 25, 50],
                                                             initialRowsPerPage = 15,
                                                             onSelectionChange,
                                                         }: DataTableProps<T>) {
    // sorting
    const [orderBy, setOrderBy] = React.useState<string>('');
    const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');

    // pagination
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(initialRowsPerPage);

    // selection
    const [selected, setSelected] = React.useState<(string | number)[]>([]);
    React.useEffect(() => {
        onSelectionChange ? onSelectionChange(selected) : undefined;
    }, [selected, onSelectionChange]);

    // columns
    const [hiddenKeys] = React.useState<string[]>(
        columns.filter((c) => c.hidden).map((c) => c.key as string)
    );
    const visibleColumns = React.useMemo(
        () => columns.filter((c) => !hiddenKeys.includes(c.key as string)),
        [columns, hiddenKeys]
    );

    // sticky header show/hide ala Android
    const [showHead, setShowHead] = React.useState(true);
    const lastYRef = React.useRef(0);

    // resizable widths (header-only handle)
    const DEFAULT_WIDTH = 180;
    const DEFAULT_MIN = 100;
    const [colWidths, setColWidths] = React.useState<Record<string, number>>(() =>
        visibleColumns.reduce((acc, c) => {
            const key = c.key as string;
            acc[key] = typeof c.width === 'number' ? c.width : DEFAULT_WIDTH;
            return acc;
        }, {} as Record<string, number>)
    );
    React.useEffect(() => {
        setColWidths((prev) => {
            const next = { ...prev };
            visibleColumns.forEach((c) => {
                const k = c.key as string;
                if (!(k in next)) next[k] = typeof c.width === 'number' ? c.width : DEFAULT_WIDTH;
            });
            return next;
        });
    }, [visibleColumns]);

    const startResizeRef = React.useRef<{
        key: string;
        startX: number;
        startW: number;
    } | null>(null);

    const onMouseDownResize = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        e.stopPropagation();
        startResizeRef.current = {
            key,
            startX: e.clientX,
            startW: colWidths[key] ?? DEFAULT_WIDTH,
        };
        if (typeof document !== 'undefined') document.body.style.userSelect = 'none';
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', onMouseMoveResize);
            window.addEventListener('mouseup', onMouseUpResize);
        }
    };
    const onMouseMoveResize = (e: MouseEvent) => {
        const s = startResizeRef.current;
        if (!s) return;
        const delta = e.clientX - s.startX;
        const minW =
            visibleColumns.find((c) => (c.key as string) === s.key)?.minWidth ?? DEFAULT_MIN;
        const nextW = Math.max(minW, s.startW + delta);
        setColWidths((prev) => ({ ...prev, [s.key]: nextW }));
    };
    const onMouseUpResize = () => {
        startResizeRef.current = null;
        if (typeof document !== 'undefined') document.body.style.userSelect = '';
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', onMouseMoveResize);
            window.removeEventListener('mouseup', onMouseUpResize);
        }
    };

    // filters (popover per kolom)
    const [filters, setFilters] = React.useState<Record<string, string>>({});
    const setFilter = (key: string, val: string) =>
        setFilters((prev) => ({ ...prev, [key]: val }));
    const [anchorFilter, setAnchorFilter] = React.useState<null | HTMLElement>(null);
    const [activeColKey, setActiveColKey] = React.useState<string | null>(null);
    const [draftFilter, setDraftFilter] = React.useState<string>('');

    const openFilterFor = (e: React.MouseEvent<HTMLElement>, key: string) => {
        setActiveColKey(key);
        setDraftFilter(filters[key] ?? '');
        setAnchorFilter(e.currentTarget);
    };
    const closeFilter = () => setAnchorFilter(null);
    const applyFilter = () => {
        if (activeColKey) setFilter(activeColKey, draftFilter);
        closeFilter();
    };
    const clearFilter = () => {
        if (activeColKey) setFilter(activeColKey, '');
        closeFilter();
    };

    // apply filters
    const filtered = React.useMemo(
        () =>
            visibleColumns.reduce((acc, col) => {
                const v = filters[col.key as string];
                return v && String(v).trim()
                    ? acc.filter((r) => includesInsensitive((r as any)[col.key as string], v))
                    : acc;
            }, rows),
        [rows, filters, visibleColumns]
    );

    // sort + paginate
    const sorted = React.useMemo(
        () => (orderBy ? [...filtered].sort(sortByKey(orderBy, order)) : filtered),
        [filtered, orderBy, order]
    );
    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const paged = React.useMemo(
        () => sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [sorted, page, rowsPerPage]
    );
    React.useEffect(() => setPage(0), [rowsPerPage, filters]);

    const handleSort = (key: string, enable?: boolean) => {
        if (!enable) return;
        if (orderBy !== key) {
            setOrderBy(key);
            setOrder('asc');
            return;
        }
        setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const allChecked =
        enableSelection &&
        selected.length &&
        paged.every((r) => selected.includes((r as any).id));
    const someChecked =
        enableSelection &&
        selected.length > 0 &&
        !allChecked &&
        paged.some((r) => selected.includes((r as any).id));
    const toggleAll = () =>
        setSelected((prev) => {
            const pageIds = paged.map((r) => (r as any).id);
            if (allChecked) {
                return prev.filter((id) => pageIds.indexOf(id) === -1);
            }
            const toAdd: (string | number)[] = [];
            for (let i = 0; i < pageIds.length; i++) {
                const id = pageIds[i];
                if (prev.indexOf(id) === -1) toAdd.push(id);
            }
            return prev.concat(toAdd);
        });
    const toggleOne = (id: string | number) =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    // Paksa TableContainer selalu ngescroll dirinya sendiri
    const handleWheelCapture = (e: React.WheelEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const atTop = el.scrollTop <= 0;
        const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

        if (!((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0))) {
            el.scrollTop += e.deltaY;
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 3,
                boxShadow: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
            onMouseLeave={onMouseUpResize}
        >
            <CardContent sx={{ p: 0, display: 'flex', flex: 1, minHeight: 0 }}>
                <TableContainer
                    tabIndex={0}
                    onWheelCapture={handleWheelCapture}
                    sx={{
                        flex: 1,
                        height: '100%',
                        overflow: 'auto',
                        touchAction: 'pan-y',
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarGutter: 'stable',
                    }}
                    onScroll={(e) => {
                        const y = (e.currentTarget as HTMLDivElement).scrollTop;
                        const d = y - (lastYRef.current || 0);
                        if (Math.abs(d) > 4) setShowHead(d < 0);
                        lastYRef.current = y;
                    }}
                >
                    <Table
                        size="medium"
                        sx={{
                            tableLayout: 'fixed',
                            '& td, & th': { border: 0 },
                            '& td + td, & th + th': {
                                borderLeft: (t) => `1px solid ${alpha(t.palette.divider, 0.12)}`,
                            },
                            '& th:first-of-type, & td:first-of-type': { borderLeft: 'none' },
                            '& th:last-of-type, & td:last-of-type': { borderRight: 'none' },
                        }}
                    >
                        <TableHead
                            sx={{
                                position: 'sticky',
                                top: 0,
                                zIndex: 2,
                                transform: showHead ? 'translateY(0)' : 'translateY(-100%)',
                                transition: 'transform .2s ease',
                                pointerEvents: showHead ? 'auto' : 'none',
                                backgroundColor: (t) => alpha(t.palette.background.paper, 0.92),
                                backdropFilter: 'saturate(160%) blur(4px)',
                                '& th': {
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    borderBottom: (t) => `1px solid ${alpha(t.palette.divider, 0.18)}`,
                                    boxShadow: (t) => `inset 0 -1px 0 ${alpha(t.palette.common.black, 0.06)}`,
                                },
                            }}
                        >
                            <TableRow>
                                {enableSelection && (
                                    <TableCell sx={{ width: 48, minWidth: 48 }} padding="checkbox">
                                        <Checkbox
                                            indeterminate={Boolean(someChecked)}
                                            checked={Boolean(allChecked)}
                                            onChange={toggleAll}
                                        />
                                    </TableCell>
                                )}
                                {visibleColumns.map((col) => {
                                    const key = col.key as string;
                                    const w = colWidths[key] ?? DEFAULT_WIDTH;
                                    const resizable = col.resizable !== false;
                                    return (
                                        <TableCell
                                            key={key}
                                            align={col.align ?? 'left'}
                                            sx={{
                                                position: 'relative',
                                                width: w,
                                                maxWidth: w,
                                                minWidth: col.minWidth ?? DEFAULT_MIN,
                                                backgroundClip: 'padding-box',
                                            }}
                                        >
                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: resizable ? 2 : 0 }}>
                                                <TableSortLabel
                                                    active={orderBy === key}
                                                    direction={orderBy === key ? order : 'asc'}
                                                    onClick={() => handleSort(key, col.sortable)}
                                                    disabled={!col.sortable}
                                                >
                                                    {col.label}
                                                </TableSortLabel>
                                                <IconButton size="small" onClick={(e) => openFilterFor(e, key)}>
                                                    <FilterListRounded fontSize="small" />
                                                </IconButton>
                                                {filters[key] ? (
                                                    <Chip
                                                        size="small"
                                                        label={filters[key]}
                                                        onDelete={() => setFilter(key, '')}
                                                        sx={{ ml: 0.5 }}
                                                    />
                                                ) : null}
                                            </Stack>

                                            {/* HEADER-ONLY resize handle */}
                                            {resizable && (
                                                <Box
                                                    onMouseDown={(e) => onMouseDownResize(e, key)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: -2,
                                                        height: '100%',
                                                        width: 8,
                                                        cursor: 'col-resize',
                                                        '&:hover': (t) => ({
                                                            backgroundColor: alpha(t.palette.primary.main, 0.06),
                                                        }),
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paged.map((row, idx) => (
                                <TableRow
                                    key={(row as any).id ?? idx}
                                    hover
                                    sx={{
                                        transition: 'background-color .15s ease',
                                        '&:hover': { backgroundColor: (t) => t.palette.action.hover },
                                    }}
                                >
                                    {enableSelection && (
                                        <TableCell sx={{ width: 48, minWidth: 48 }} padding="checkbox">
                                            <Checkbox
                                                checked={selected.includes((row as any).id)}
                                                onChange={() => {
                                                    const id = (row as any).id;
                                                    setSelected((prev) =>
                                                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    {visibleColumns.map((col) => {
                                        const key = col.key as string;
                                        const w = colWidths[key] ?? DEFAULT_WIDTH;
                                        return (
                                            <TableCell
                                                key={key + '-' + ((row as any).id ?? idx)}
                                                align={col.align ?? 'left'}
                                                sx={{
                                                    position: 'relative',
                                                    width: w,
                                                    maxWidth: w,
                                                    minWidth: col.minWidth ?? DEFAULT_MIN,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    backgroundClip: 'padding-box',
                                                }}
                                            >
                                                {col.render ? col.render(row) : (row as any)[key]}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}

                            {paged.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.length + (enableSelection ? 2 : 1)}>
                                        <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                                            <Typography variant="body1">No data</Typography>
                                            <Typography variant="body2">Try changing filters.</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>

            {/* footer pager */}
            <Divider sx={{ display: 'none' }} />
            <Box
                sx={{
                    px: 2,
                    py: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <IconButton size="small" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                        <KeyboardArrowLeftRounded />
                    </IconButton>
                    <Typography variant="body2">{page + 1}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        / {totalPages}
                    </Typography>
                    <IconButton
                        size="small"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                        <KeyboardArrowRightRounded />
                    </IconButton>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        Rows per page
                    </Typography>
                    <Select
                        size="small"
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        input={<OutlinedInput />}
                    >
                        {rowsPerPageOptions.map((n) => (
                            <MenuItem key={n} value={n}>
                                {n}
                            </MenuItem>
                        ))}
                    </Select>
                </Stack>
            </Box>

            {/* Popover: Sort + Filter per kolom */}
            <Menu anchorEl={anchorFilter} open={Boolean(anchorFilter)} onClose={closeFilter}>
                <Box sx={{ p: 1.5, width: 320, display: 'grid', gap: 1 }}>
                    <Typography variant="subtitle2">Sort</Typography>
                    <Stack direction="row" spacing={1}>
                        <IconButton
                            size="small"
                            onClick={() => {
                                if (activeColKey) {
                                    setOrderBy(activeColKey);
                                    setOrder('asc');
                                }
                                closeFilter();
                            }}
                        >
                            <ArrowUpwardRounded fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                if (activeColKey) {
                                    setOrderBy(activeColKey);
                                    setOrder('desc');
                                }
                                closeFilter();
                            }}
                        >
                            <ArrowDownwardRounded fontSize="small" />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <Typography variant="subtitle2">Filter</Typography>
                    {activeColKey &&
                    (visibleColumns.find((c) => (c.key as string) === activeColKey)?.headerFilter?.type ===
                        'select') ? (
                        <Select
                            size="small"
                            value={draftFilter}
                            onChange={(e) => setDraftFilter(String(e.target.value))}
                            displayEmpty
                            input={<OutlinedInput />}
                        >
                            <MenuItem value="">
                                <em>All</em>
                            </MenuItem>
                            {(
                                (visibleColumns.find((c) => (c.key as string) === activeColKey)?.headerFilter as any) ||
                                { options: [] }
                            ).options?.map((o: any) => (
                                <MenuItem key={o.value} value={o.value}>
                                    {o.label}
                                </MenuItem>
                            ))}
                        </Select>
                    ) : (
                        <TextField
                            size="small"
                            placeholder="Type to filter"
                            value={draftFilter}
                            onChange={(e) => setDraftFilter(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchRounded />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                    <Stack direction="row" justifyContent="space-between">
                        <IconButton onClick={clearFilter} size="small">
                            <ClearRounded fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => {
                                if (activeColKey) setFilter(activeColKey, draftFilter);
                                closeFilter();
                            }}
                        >
                            {/* Apply */}
                            <ArrowDownwardRounded sx={{ transform: 'rotate(90deg)' }} fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Menu>
        </Card>
    );
}
