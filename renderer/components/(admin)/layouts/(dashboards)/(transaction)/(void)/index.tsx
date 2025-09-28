'use client';

import * as React from 'react';
import {
    Avatar,
    Box,
    Chip,
    Stack,
    Typography,
    Tooltip,
    Popover,
    Divider,
    Button,
} from '@mui/material';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';
import DoNotDisturbAltRounded from '@mui/icons-material/DoNotDisturbAltRounded';
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded';

import {
    DataTable,
    Column,
} from './(components)/TablesLayoutConstructor';

/* ========== Types ========== */
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

type ApiVoidInfo = { time?: string; is_approved?: boolean } | null;

type ApiOrderVoidItem = {
    id: string;
    qty: number;
    price: string;
    sub_total: string;
    note?: string | null;
    time_created?: string;
    time_updated?: string;
    void: ApiVoidInfo;          // null atau {status:false} = pending, {status:true} = voided
    reference?: ApiRef;         // kasir/pembuat item
    batch: ApiBatch;
    product: ApiProduct;
    variant: ApiVariant;
};

/* ========== Row model ========== */
type RowVoid = {
    id: string;
    invoice: string;
    infoCell: React.ReactNode;
    productCell: React.ReactNode;
    qty: number;
    subTotal: string | number;
    voidState: 'APPROVED' | 'PENDING';
    voidTime?: string | null;
    raw: ApiOrderVoidItem;
    invoiceCell: React.ReactNode;
    statusCell: React.ReactNode;
};

/* ========== Utils ========== */
const TZ = 'Asia/Makassar';
const fmtDateTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(new Date(iso));
    } catch { return iso || '—'; }
};
const toIDR = (v: string | number | null | undefined) => {
    const n = typeof v === 'string' ? Number(v) : v ?? 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        .format(Number.isFinite(n as number) ? (n as number) : 0);
};
const fullName = (r?: ApiRef) =>
    [r?.name?.first_name, r?.name?.last_name].filter(Boolean).join(' ').trim() || r?.username || '—';

/* Endpoints */
const EVT_READ    = 'api.transaction.batch.item:read.all';        // pakai filter { void: true }
const EVT_APPROVE = 'api.transaction.batch.item:void.approve';
const EVT_REJECT  = 'api.transaction.batch.item:void.reject';


export default function OrderVoids() {
    const [rows, setRows] = React.useState<RowVoid[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Popover state: INFO (kasir/shift/type)
    const [infoAnchor, setInfoAnchor] = React.useState<HTMLElement | null>(null);
    const [infoData, setInfoData] = React.useState<{ cashier?: ApiRef; shift?: ApiShift; type?: ApiOrderType } | null>(null);

    // Popover state: PRODUCT (variant/desc)
    const [prodAnchor, setProdAnchor] = React.useState<HTMLElement | null>(null);
    const [prodData, setProdData] = React.useState<{ product?: ApiProduct; variant?: ApiVariant } | null>(null);

    // Popover state: VOID (time)
    const [voidAnchor, setVoidAnchor] = React.useState<HTMLElement | null>(null);
    const [voidData, setVoidData] = React.useState<{ time?: string | null; state: 'APPROVED' | 'PENDING' } | null>(null);

    const openInfo = (e: React.MouseEvent<HTMLElement>, cashier?: ApiRef, shift?: ApiShift, type?: ApiOrderType) => {
        setInfoAnchor(e.currentTarget);
        setInfoData({ cashier, shift, type });
    };
    const closeInfo = () => { setInfoAnchor(null); setInfoData(null); };

    const openProd = (e: React.MouseEvent<HTMLElement>, product?: ApiProduct, variant?: ApiVariant) => {
        setProdAnchor(e.currentTarget);
        setProdData({ product, variant });
    };
    const closeProd = () => { setProdAnchor(null); setProdData(null); };

    const openVoid = (e: React.MouseEvent<HTMLElement>, time?: string | null, state?: 'APPROVED' | 'PENDING') => {
        setVoidAnchor(e.currentTarget);
        setVoidData({ time, state: state ?? 'PENDING' });
    };
    const closeVoid = () => { setVoidAnchor(null); setVoidData(null); };

    const mapVoidState = (info: ApiVoidInfo): RowVoid['voidState'] => {
        // Sesuai instruksi: null ATAU status:false => PENDING; true => APPROVED (Voided)
        if (info === null || info?.is_approved === false || info === undefined) return 'PENDING';
        return 'APPROVED';
    };

    const makeStatusChip = (row: RowVoid) => {
        const label = row.voidState === 'APPROVED' ? 'Voided' : 'Pending';
        const color = row.voidState === 'APPROVED' ? 'success' : 'default';
        return (
            <Chip
                size="small"
                color={color as any}
                variant="outlined"
                label={label}
                onClick={(e) => openVoid(e, row.voidTime ?? undefined, row.voidState)}
                sx={{ borderRadius: 2, cursor: 'pointer' }}
            />
        );
    };

    const fetchVoids = React.useCallback(() => {
        if (!window.api) {
            console.error('Failed Get Window Api Bridge');
            setError('Bridge tidak tersedia');
            return;
        }
        setLoading(true);
        window.api
            .invoke(EVT_READ, { void: true })
            .then((result: any) => {
                const data = (result?.data ?? []) as ApiOrderVoidItem[];

                const mapped: RowVoid[] = data.map((it) => {
                    const trx = it.batch?.transaction;
                    const invoice = trx?.invoice ?? '—';
                    const voidState = mapVoidState(it.void);
                    const voidTime = (it.void && 'time' in it.void) ? it.void?.time : null;

                    return {
                        id: it.id,
                        invoice,
                        qty: it.qty,
                        subTotal: it.sub_total,
                        voidState,
                        voidTime,
                        raw: it,

                        invoiceCell: (
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                                    <ReceiptLongRounded fontSize="small" />
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap title={invoice}>{invoice}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap title={fmtDateTime(trx?.time_created)}>
                                        {fmtDateTime(trx?.time_created)}
                                    </Typography>
                                </Box>
                            </Stack>
                        ),

                        infoCell: (
                            <Tooltip title="Detail kasir/shift/type">
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    label={fullName(it.reference)}
                                    onClick={(e) => openInfo(e, it.reference, trx?.shift, trx?.order_type)}
                                    sx={{ borderRadius: 2, cursor: 'pointer', maxWidth: 220 }}
                                />
                            </Tooltip>
                        ),

                        productCell: (
                            <Tooltip title="Lihat variant & deskripsi">
                                <Chip
                                    size="small"
                                    variant="outlined"
                                    icon={<ShoppingCartRounded fontSize="small" />}
                                    label={it.product?.name ?? '—'}
                                    onClick={(e) => openProd(e, it.product, it.variant)}
                                    sx={{ borderRadius: 2, cursor: 'pointer', maxWidth: 260 }}
                                />
                            </Tooltip>
                        ),

                        statusCell: makeStatusChip({
                            id: it.id,
                            invoice,
                            qty: it.qty,
                            subTotal: it.sub_total,
                            voidState,
                            voidTime,
                            raw: it,
                            infoCell: <></>,
                            productCell: <></>,
                            invoiceCell: <></>,
                            statusCell: <></>,
                        }),
                    };
                });

                setRows(mapped);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setRows([]);
                setError(err?.msg ?? 'Gagal memuat data void. Periksa koneksi jaringan/server.');
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchVoids(); }, [fetchVoids]);

    const onApprove = (row: RowVoid) => {
        if (!window.api) return;
        window.api.invoke(EVT_APPROVE, { id: row.id })
            .then(() => fetchVoids())
            .catch((e: any) => console.error('approve failed', e));
    };

    const onReject = (row: RowVoid) => {
        if (!window.api) return;
        window.api.invoke(EVT_REJECT, { id: row.id })
            .then(() => fetchVoids())
            .catch((e: any) => console.error('reject failed', e));
    };

    const columns: Column<RowVoid>[] = [
        { key: 'invoiceCell', label: 'INVOICE', sortable: true, width: 220, minWidth: 200, headerFilter: { type: 'text' } },
        {
            key: 'actions',
            label: 'ACTIONS',
            sortable: false,
            align: 'right',
            width: 220,
            minWidth: 200,
            render: (r) => {
                if (r.voidState === 'APPROVED') {
                    // Sudah voided: hanya chip Voided
                    return (
                        <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            label="Voided"
                            sx={{ borderRadius: 2 }}
                        />
                    );
                }

                // Pending: tombol mini Approve & Reject
                return (
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: 'wrap' }}>
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<HowToRegRounded />}
                            onClick={() => onApprove(r)}
                            sx={{ borderRadius: 2 }}
                        >
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DoNotDisturbAltRounded />}
                            onClick={() => onReject(r)}
                            sx={{ borderRadius: 2 }}
                        >
                        </Button>
                    </Stack>
                );
            },
        },
        { key: 'infoCell',    label: 'INFO',    sortable: false, width: 180, minWidth: 150, headerFilter: { type: 'text' } },
        { key: 'productCell', label: 'PRODUCT', sortable: true,  width: 150, minWidth: 150, headerFilter: { type: 'text' } },
        { key: 'qty',         label: 'QTY',     sortable: true,  align: 'right', width: 90,  minWidth: 80 },
        {
            key: 'subTotal',
            label: 'SUBTOTAL',
            sortable: true,
            align: 'right',
            width: 140,
            minWidth: 120,
            render: (r) => <Typography variant="body2" fontWeight={600}>{toIDR(r.subTotal)}</Typography>,
        },
        {
            key: 'statusCell',
            label: 'VOID STATUS',
            sortable: true,
            width: 160,
            minWidth: 140,
            render: (r) => r.statusCell,
        },
    ];

    return (
        <Box
            sx={{
                p: 2,
                display: 'grid',
                gap: 2,
                height: '100%',
                minHeight: 0,
                gridTemplateRows: 'auto 1fr',
            }}
        >
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="overline" color="text.secondary">Transactions / Order Voids</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Chip label="Refresh" onClick={fetchVoids} variant="outlined" />
                </Stack>
            </Stack>

            {/* Table */}
            <DataTable<RowVoid>
                columns={columns}
                rows={rows}
                initialRowsPerPage={15}
                enableSelection={false}
            />

            {/* Popover: INFO */}
            <Popover
                open={Boolean(infoAnchor)}
                anchorEl={infoAnchor}
                onClose={closeInfo}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { p: 1.5, borderRadius: 2, minWidth: 260 } }}
            >
                <Stack spacing={1}>
                    <Typography variant="subtitle2">Detail Info</Typography>
                    <Divider />
                    <Typography variant="body2"><b>Kasir:</b> {fullName(infoData?.cashier)}</Typography>
                    <Typography variant="body2"><b>Shift:</b> {infoData?.shift?.name ?? '—'} {infoData?.shift ? `(${infoData.shift.start_time}–${infoData.shift.end_time})` : ''}</Typography>
                    <Typography variant="body2"><b>Order Type:</b> {infoData?.type?.name ?? '—'}</Typography>
                </Stack>
            </Popover>

            {/* Popover: PRODUCT */}
            <Popover
                open={Boolean(prodAnchor)}
                anchorEl={prodAnchor}
                onClose={closeProd}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { p: 1.5, borderRadius: 2, minWidth: 280 } }}
            >
                <Stack spacing={1}>
                    <Typography variant="subtitle2">Detail Produk</Typography>
                    <Divider />
                    <Typography variant="body2"><b>Produk:</b> {prodData?.product?.name ?? '—'}</Typography>
                    <Typography variant="body2"><b>Variant:</b> {prodData?.variant?.name ?? '—'}{prodData?.variant?.code ? ` (${prodData.variant.code})` : ''}</Typography>
                    <Typography variant="body2" color="text.secondary">{prodData?.product?.description ?? '—'}</Typography>
                </Stack>
            </Popover>

            {/* Popover: VOID detail */}
            <Popover
                open={Boolean(voidAnchor)}
                anchorEl={voidAnchor}
                onClose={closeVoid}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { p: 1.5, borderRadius: 2, minWidth: 240 } }}
            >
                <Stack spacing={1}>
                    <Typography variant="subtitle2">Void Detail</Typography>
                    <Divider />
                    <Typography variant="body2"><b>Status:</b> {voidData?.state === 'APPROVED' ? 'Voided' : 'Pending'}</Typography>
                    <Typography variant="body2"><b>Time:</b> {fmtDateTime(voidData?.time)}</Typography>
                </Stack>
            </Popover>
        </Box>
    );
}
