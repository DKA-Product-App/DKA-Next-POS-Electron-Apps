'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import AssignmentTurnedInRounded from '@mui/icons-material/AssignmentTurnedInRounded';
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

import SweetAlert2, { SweetAlert2Props } from 'react-sweetalert2';
import { useState } from 'react';
import { useSession } from '../../../../../../contexts/SessionProviderContext';
import { useThemeCharger } from '../../../../../../contexts/ThemeCharger';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment'; // Import moment for date handling

/* ========== Types (API) ========== */
type ApiName = { first_name?: string; last_name?: string };
type ApiRef = { id: string; name?: ApiName; username?: string };

type ApiShift = { id: string; name: string; start_time: string; end_time: string };
type ApiOrderType = { id: string; code: string; name: string };

type ApiTransaction = {
    id: string;
    invoice: string;
    time_created?: string;
    time_updated?: string;
    time_closed?: string | null;
    reference?: ApiRef;
    shift?: ApiShift;
    order_type?: ApiOrderType;
};

type ApiBatch = { id: string; batch: number; transaction: ApiTransaction };

type ApiProduct = { id: string; name: string; description?: string | null; image?: string | null };
type ApiVariant = { id: string; code: string; name: string; price: string | number };

type ApiVoidInfo = { id?: string; time?: string; is_approved?: boolean; reason?: string } | null;

type ApiOrderVoidItem = {
    id: string;
    qty: number;
    price: string;
    sub_total: string;
    note?: string | null;
    time_created?: string;
    time_updated?: string;
    void: ApiVoidInfo;          // null atau {is_approved:false} = pending, {is_approved:true} = voided
    reference?: ApiRef;         // kasir/pembuat item
    batch: ApiBatch;
    product: ApiProduct;
    variant: ApiVariant;
};

/* ========== Utils ========== */
const TZ = 'Asia/Makassar';
const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: TZ,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(iso));
    } catch {
        return iso || '—';
    }
};
const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
        Number.isFinite(n as number) ? (n as number) : 0,
    );
};
const fullName = (r?: ApiRef) => [r?.name?.first_name, r?.name?.last_name].filter(Boolean).join(' ').trim() || r?.username || '—';

/* Endpoints */
const EVT_READ = 'api.transaction.batch.item:read.all'; // pakai filter { void: true }
const EVT_APPROVALS = 'api.transaction.batch.item.void:update.one';
const EVT_REJECTS = 'api.transaction.batch.item.void:delete.one';

/* ========== Tree Row Types ========== */
type ChildKind = 'info' | 'product';

type VoidChildRow = {
    kind: ChildKind;
    id: string;
    // INFO fields
    cashierName?: string;
    shiftName?: string;
    shiftTime?: string;
    orderType?: string;
    // PRODUCT fields
    productName?: string;
    variantName?: string;
    variantCode?: string;
    productDesc?: string | null;
};

type VoidParentRow = {
    kind: 'parent';
    id: string;
    invoice: string;
    createdAt?: string | null;
    qty: number;
    subTotal: string | number;
    voidState: 'APPROVED' | 'PENDING';
    voidTime?: string | null;
    reason?: string | null;
    // reference (for actions)
    _voidId?: string | undefined;
    _sessionRefId?: string | undefined;
    subRows?: VoidChildRow[];
};

/* ========== Component ========== */
export default function OrderVoidsTree() {
    const [rows, setRows] = React.useState<VoidParentRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Pagination State
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 15,
    });
    const [rowCount, setRowCount] = React.useState(0);

    // Date Filter State
    const [startDate, setStartDate] = React.useState<moment.Moment | null>(moment().startOf('day'));
    const [endDate, setEndDate] = React.useState<moment.Moment | null>(moment().endOf('day'));

    const { mode } = useThemeCharger();
    const { Session } = useSession();

    const [swalProps, setSwalProps] = useState<SweetAlert2Props>({});

    const mapVoidState = (info: ApiVoidInfo): VoidParentRow['voidState'] => {
        if (info === null || info?.is_approved === false || info === undefined) return 'PENDING';
        return 'APPROVED';
    };

    const fetchVoids = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            setRows([]);
            return;
        }
        setLoading(true);

        const { pageIndex, pageSize } = pagination;
        const payload: any = {
            void: true,
            page: pageIndex + 1,
            limit: pageSize,
        };

        if (startDate && endDate) {
            payload.startAt = startDate.format('YYYY-MM-DD HH:mm:ss');
            payload.endAt = endDate.format('YYYY-MM-DD HH:mm:ss');
        }

        window.api
            .invoke(EVT_READ, payload)
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiOrderVoidItem[];
                const mapped: VoidParentRow[] = data.map((it) => {
                    const trx = it.batch?.transaction;
                    const invoice = trx?.invoice ?? '—';
                    const voidState = mapVoidState(it.void);
                    const voidTime = (it.void && 'time' in it.void) ? it.void?.time : null;

                    const childInfo: VoidChildRow = {
                        kind: 'info',
                        id: `${it.id}-info`,
                        cashierName: fullName(it.reference),
                        shiftName: trx?.shift?.name ?? '—',
                        shiftTime: trx?.shift ? `${trx.shift.start_time}–${trx.shift.end_time}` : undefined,
                        orderType: trx?.order_type?.name ?? '—',
                    };

                    const childProduct: VoidChildRow = {
                        kind: 'product',
                        id: `${it.id}-product`,
                        productName: it.product?.name ?? '—',
                        variantName: it.variant?.name ?? undefined,
                        variantCode: it.variant?.code ?? undefined,
                        productDesc: it.product?.description ?? null,
                    };

                    return {
                        kind: 'parent',
                        id: it.id,
                        invoice,
                        createdAt: trx?.time_created ?? null,
                        qty: it.qty,
                        subTotal: it.sub_total,
                        voidState,
                        voidTime,
                        reason: it?.void?.reason ?? null,
                        _voidId: it?.void?.id,
                        _sessionRefId: Session?.id,
                        subRows: [childInfo, childProduct],
                    };
                });

                setRows(mapped);

                // Handle pagination meta
                if (result?.meta?.total) {
                    setRowCount(result.meta.total);
                } else {
                    setRowCount(data.length);
                }

                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat data void. Periksa koneksi jaringan/server.');
            })
            .finally(() => setLoading(false));
    }, [Session?.id, pagination.pageIndex, pagination.pageSize, startDate, endDate]);

    React.useEffect(() => {
        fetchVoids();
    }, [fetchVoids]);

    /** ==================================================
     *  SINGLE ENTRY POINT: Ambil Tindakan
     *  Confirm => APPROVE, Cancel => REJECT
     *  ================================================== */
    const onTakeAction = (row: VoidParentRow) => {
        if (!window.api) return;

        const voidId = row._voidId;
        if (!voidId) {
            setSwalProps({
                show: true,
                icon: 'error',
                theme: mode,
                title: 'Data void tidak valid',
                text: 'ID void tidak ditemukan.',
            });
            return;
        }

        const cashierReason = row?.reason || '—';

        setSwalProps({
            show: true,
            icon: 'question',
            theme: mode,
            title: 'Ambil Tindakan',
            html: `<div style="text-align:left">
                    <div><b>NO Order:</b> ${row.invoice}</div>
                    <div style="margin-top:8px"><b>Reason dari kasir:</b></div>
                    <div style="white-space:pre-wrap;border:1px solid #ddd;padding:8px;border-radius:8px;margin-top:4px;">${(cashierReason || '—')
                    .toString()
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')}</div>
                </div>`,
            confirmButtonText: 'Setujui',
            showCancelButton: true,
            cancelButtonText: 'Tolak',
            reverseButtons: true,
            didClose: () => setSwalProps((prev) => ({ ...prev, show: false })),
            onConfirm: () => {
                window.api
                    .invoke(EVT_APPROVALS, {
                        params: { id: voidId },
                        data: {
                            reference: { id: row._sessionRefId ?? undefined },
                            is_approved: true,
                        },
                    })
                    .then((res: any) => {
                        setSwalProps({
                            show: true,
                            icon: 'success',
                            theme: mode,
                            title: 'Voided (Approved)',
                            text: `${res.msg}`,
                        });
                        fetchVoids();
                    })
                    .catch((e: any) => {
                        setSwalProps({
                            show: true,
                            icon: 'error',
                            theme: mode,
                            title: 'Gagal Approve',
                            text: `${e?.msg || e}`,
                        });
                        console.error('approve failed', e);
                    })
                    .finally(() => setSwalProps((prev) => ({ ...prev, show: false })));
            },
            onResolve: (result: any) => {
                if (result?.isDismissed && (result?.dismiss === 'cancel' || result?.dismiss === 'backdrop' || result?.dismiss === 'close')) {
                    if (result?.dismiss !== 'cancel') return;
                    window.api
                        .invoke(EVT_REJECTS, {
                            params: { id: voidId },
                            data: { reference: { id: row._sessionRefId ?? undefined } },
                        })
                        .then((res: any) => {
                            setSwalProps({
                                show: true,
                                icon: 'success',
                                theme: mode,
                                title: 'Ditolak',
                                text: `${res.msg}`,
                            });
                            fetchVoids();
                        })
                        .catch((e: any) => {
                            setSwalProps({
                                show: true,
                                icon: 'error',
                                theme: mode,
                                title: 'Gagal Menolak',
                                text: `${e?.msg || e}`,
                            });
                            console.error('reject failed', e);
                        })
                        .finally(() => setSwalProps((prev) => ({ ...prev, show: false })));
                } else {
                    setSwalProps((prev) => ({ ...prev, show: false }));
                }
            },
        });
    };

    /* ========== Columns (Tree) ========== */
    const columns = React.useMemo<MRT_ColumnDef<VoidParentRow | VoidChildRow>[]>(
        () => [
            // VOID / DETAILS
            {
                id: 'voidOrDetail',
                header: 'VOID / DETAILS',
                size: 380,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as VoidParentRow;
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    <ReceiptLongRounded fontSize="small" />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={r.invoice}>
                                        {r.invoice}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={fmtDateTime(r.createdAt)}>
                                        {fmtDateTime(r.createdAt)}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    }
                    const c = row.original as VoidChildRow;
                    if (c.kind === 'info') {
                        return (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                <PersonRounded fontSize="small" />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={c.cashierName}>
                                        {c.cashierName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={`${c.shiftName ?? '—'} ${c.shiftTime ? `(${c.shiftTime})` : ''}`}>
                                        {c.shiftName ?? '—'} {c.shiftTime ? `(${c.shiftTime})` : ''}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    }
                    // product child
                    return (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <ShoppingCartRounded fontSize="small" />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap title={c.productName}>
                                    {c.productName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap title={`${c.variantName ?? '—'}${c.variantCode ? ` (${c.variantCode})` : ''}`}>
                                    {c.variantName ?? '—'}{c.variantCode ? ` (${c.variantCode})` : ''}
                                </Typography>
                            </Box>
                        </Stack>
                    );
                },
                muiTableBodyCellProps: ({ row }) =>
                    row.depth === 0
                        ? {}
                        : {
                            sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` },
                        },
            },

            // EXTRA DETAIL (Order Type / Product Desc) — hanya child
            {
                id: 'extraDetail',
                header: 'EXTRA',
                size: 320,
                Cell: ({ row }) => {
                    if (row.depth === 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const c = row.original as VoidChildRow;
                    if (c.kind === 'info') {
                        return (
                            <Typography variant="body2" noWrap title={c.orderType ?? '—'}>
                                <LocalOfferRounded fontSize="inherit" style={{ verticalAlign: 'text-bottom' }} />{' '}
                                {c.orderType ?? '—'}
                            </Typography>
                        );
                    }
                    return (
                        <Tooltip title={c.productDesc ?? '—'}>
                            <Typography variant="body2" color="text.secondary" noWrap>
                                {c.productDesc ?? '—'}
                            </Typography>
                        </Tooltip>
                    );
                },
            },

            // QTY (hanya parent)
            {
                id: 'qty',
                header: 'QTY',
                size: 90,
                Cell: ({ row }) => {
                    if (row.depth === 0) {
                        const r = row.original as VoidParentRow;
                        return <Typography variant="body2" textAlign="right">{r.qty}</Typography>;
                    }
                    return <Typography variant="body2" color="text.disabled" textAlign="right">—</Typography>;
                },
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                muiTableFooterCellProps: { align: 'right' },
            },

            // REASON (parent only)
            {
                id: 'reason',
                header: 'REASON',
                size: 300,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return <Typography variant="body2" color="text.disabled">—</Typography>;
                    const r = row.original as VoidParentRow;
                    const reason = r.reason || '—';
                    return (
                        <Tooltip title={typeof reason === 'string' ? reason : '—'}>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 360 }}>
                                {reason}
                            </Typography>
                        </Tooltip>
                    );
                },
            },

            // HARGA (parent only)
            {
                id: 'price',
                header: 'HARGA',
                size: 140,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return <Typography variant="body2" color="text.disabled" textAlign="right">—</Typography>;
                    const r = row.original as VoidParentRow;
                    return (
                        <Typography variant="body2" fontWeight={600} textAlign="right">
                            {toIDR(r.subTotal)}
                        </Typography>
                    );
                },
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                muiTableFooterCellProps: { align: 'right' },
            },

            // STATUS (chip, parent only)
            {
                id: 'status',
                header: 'STATUS',
                size: 140,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return <Typography variant="body2" color="text.disabled" textAlign="center">—</Typography>;
                    const r = row.original as VoidParentRow;
                    const label = r.voidState === 'APPROVED' ? 'Voided' : 'Pending';
                    const color = r.voidState === 'APPROVED' ? 'success' : 'default';
                    return (
                        <Chip
                            size="small"
                            color={color as any}
                            variant="outlined"
                            label={label}
                            sx={{ borderRadius: 2 }}
                        />
                    );
                },
                muiTableBodyCellProps: { align: 'center' },
                muiTableHeadCellProps: { align: 'center' },
                muiTableFooterCellProps: { align: 'center' },
            },

            // ACTIONS (Approve / Reject via swal — parent only)
            {
                id: 'actions',
                header: 'ACTIONS',
                size: 200,
                enableColumnFilter: false,
                enableSorting: false,
                Cell: ({ row }) => {
                    if (row.depth !== 0) return null;
                    const r = row.original as VoidParentRow;
                    if (r.voidState === 'APPROVED') {
                        return (
                            <Chip
                                size="small"
                                color="success"
                                variant="outlined"
                                label="Voided"
                                icon={<CheckCircleRounded />}
                                sx={{ borderRadius: 2 }}
                            />
                        );
                    }
                    return (
                        <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<AssignmentTurnedInRounded />}
                            onClick={() => onTakeAction(r)}
                            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                        >
                            Ambil Tindakan
                        </Button>
                    );
                },
                muiTableBodyCellProps: { align: 'right' },
                muiTableHeadCellProps: { align: 'right' },
                muiTableFooterCellProps: { align: 'right' },
            },
        ],
        [mode], // depends on theme for swal
    );

    /* ========== MRT Instance (tree/subRows) ========== */
    const table = useMaterialReactTable({
        columns,
        data: rows as any, // parent = VoidParentRow, child = VoidChildRow
        enableExpanding: true,
        enableExpandAll: false,
        filterFromLeafRows: true,
        getSubRows: (row: VoidParentRow | VoidChildRow) => (row as VoidParentRow).subRows as any,
        initialState: { density: 'comfortable' },
        paginateExpandedRows: false,

        // baseline template v2
        state: {
            showProgressBars: loading,
            pagination,
        },
        manualPagination: true,
        rowCount,
        onPaginationChange: setPagination,

        columnFilterDisplayMode: 'popover',
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        enableRowSelection: false,
        enableStickyHeader: true,
        muiTablePaperProps: { sx: { display: 'flex', flexDirection: 'column', flex: 1 } },
        muiTableContainerProps: { sx: { flex: 1 } },

        renderTopToolbarCustomActions: () => (
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%', gap: 1 }}>
                <Box>
                    <Typography variant="overline" color="text.secondary">Transactions / Order Voids</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                    {/* Date Pickers */}
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                        <Stack direction="row" spacing={1}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={(newValue) => {
                                    setStartDate(newValue);
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                            />
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={(newValue) => {
                                    setEndDate(newValue);
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                                slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                            />
                        </Stack>
                    </LocalizationProvider>

                    <Button variant="outlined" onClick={fetchVoids}>Refresh</Button>
                </Stack>
            </Stack>
        ),
    });

    return (
        <>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
                    <MaterialReactTable table={table} />
                </Box>
            </Paper>

            {/* Global SweetAlert portal */}
            <SweetAlert2 {...swalProps} />
        </>
    );
}
