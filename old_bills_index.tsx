'use client';

import * as React from 'react';
import {
    Box, Button, Chip, Stack, Typography, Avatar,
    Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded'; // Transaction
import PrintRounded from '@mui/icons-material/PrintRounded';            // Bill
import ArrowDropDownRounded from '@mui/icons-material/ArrowDropDownRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import TableViewRounded from '@mui/icons-material/TableViewRounded';

import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
} from 'material-react-table';

import { mkConfig, generateCsv, download } from 'export-to-csv';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ImgWithSkeleton } from '../../../../../../utils/ImageProcessingIPC';

/* ================= Helpers ================= */
const toNum = (v?: string | number | null) =>
    v == null ? 0 : typeof v === 'number' ? v : Number(v);
const fmtID = (n: number) =>
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

/* ============== API types (yang kamu kasih) ============== */
type ApiPrinterOptions = { mode?: string; port?: number; timeout?: number; ip_address?: string };
type ApiPrinter = { id: string; name: string; description?: string | null; options?: ApiPrinterOptions | null; status?: boolean };
type ApiCategory = { id: string; name: string; description?: string | null; status?: boolean; printer?: ApiPrinter[] };
type ApiProduct = { id: string; name: string; image?: string | null; description?: string | null; status?: boolean; category?: ApiCategory[] };
type ApiItem = {
    id: string; qty: number; price: string; sub_total: string; status?: boolean;
    productVariant?: { id: string; code?: string; name?: string; price?: string; product?: ApiProduct };
};
type ApiOrderType = { id: string; code: string; name: string };
type ApiShift = { id: string; name: string; start_time?: string; end_time?: string; status?: boolean };
type ApiBranch = { id: string; name: string };
type ApiTransaction = {
    id: string; invoice: string; time_created?: string; time_updated?: string; time_deleted?: string | null; time_closed?: string | null;
    branch?: ApiBranch[]; shift?: ApiShift; order_type?: ApiOrderType;
};
type ApiPaid = { id: string; status: boolean; tender: string };
type ApiBill = {
    id: string; bill: string; tax: number; time_created?: string; time_updated?: string; time_deleted?: string | null;
    branch?: ApiBranch[]; transaction: ApiTransaction; items: ApiItem[]; paid: ApiPaid;
};
type ApiBillsResponse = { status: boolean; code: number; msg: string; data: ApiBill[] };

/* ============== Row union: tx -> bill -> item ============== */
type TxRow = {
    kind: 'tx';
    id: string;
    invoice: string;
    orderType: string | null;
    billsCount: number;
    total: number;          // sum grand total semua bills (total+tax)
    subRows: BillRow[];
    node: React.ReactNode;
};

type BillRow = {
    kind: 'bill';
    id: string;
    billNo: string;
    taxRate: number;        // 0.1 = 10%
    total: number;          // sum items (qty*price atau sub_total)
    grandTotal: number;     // total + tax
    paid: boolean;
    tender: number;
    subRows: ItemRow[];
    node: React.ReactNode;
};

type ItemRow = {
    kind: 'item';
    id: string;
    title: string;          // product · variant
    qty: number;
    price: number;
    subTotal: number;
    node: React.ReactNode;
};

type AnyRow = TxRow | BillRow | ItemRow;

/* ============== Mapper: ApiBill[] -> TxRow[] (tree) ============== */
function mapToTree(bills: ApiBill[]): TxRow[] {
    const txMap = new Map<string, TxRow>();

    for (const b of bills ?? []) {
        const tx = b.transaction;
        const txId = tx?.id ?? 'unknown';

        if (!txMap.has(txId)) {
            const orderType = tx?.order_type?.name ?? null;

            txMap.set(txId, {
                kind: 'tx',
                id: txId,
                invoice: tx?.invoice ?? '—',
                orderType,
                billsCount: 0,
                total: 0,
                subRows: [],
                node: (
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar variant="rounded" sx={{ width: 32, height: 32, borderRadius: 1 }}>
                            <ReceiptLongRounded fontSize="small" />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap title={`Invoice ${tx?.invoice ?? ''}`}>
                                Invoice {tx?.invoice ?? '—'}
                            </Typography>
                        </Box>
                    </Stack>
                ),
            });
        }

        const txNode = txMap.get(txId)!;

        // Build bill -> items
        const items: ItemRow[] = (b.items ?? []).map((it) => {
            const p = it.productVariant?.product?.name ?? '—';
            const v = it.productVariant?.name ? ` · ${it.productVariant?.name}` : '';
            const price = toNum(it.price);
            const sub = toNum(it.sub_total) || price * it.qty;
            return {
                kind: 'item',
                id: it.id,
                title: `${p}${v}`,
                qty: it.qty,
                price,
                subTotal: sub,
                node: (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1, overflow: 'hidden', bgcolor: 'background.neutral' }}>
                            <ImgWithSkeleton path={it?.productVariant?.product?.image} alt={it?.productVariant?.product?.name} />
                        </Box>
                        <Typography variant="body2" fontWeight={600} noWrap title={`${p}${v}`}>
                            {p}{v}
                        </Typography>
                    </Stack>
                ),
            };
        });

        const itemsTotal = items.reduce((a, r) => a + r.subTotal, 0);
        const taxRate = Number.isFinite(b.tax) ? b.tax : 0;
        const grand = Math.round(itemsTotal + itemsTotal * taxRate);

        const billRow: BillRow = {
            kind: 'bill',
            id: b.id,
            billNo: b.bill,
            taxRate,
            total: itemsTotal,
            grandTotal: grand,
            paid: !!b.paid?.status,
            tender: toNum(b.paid?.tender),
            subRows: items,
            node: (
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                    <Avatar variant="rounded" sx={{ width: 28, height: 28, borderRadius: 1 }}>
                        <PrintRounded fontSize="small" />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap title={`Bill #${b.bill}`}>
                            Bill #{b.bill}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            Tax {Math.round(taxRate * 100)}% • {b.paid?.status ? 'Paid' : 'Unpaid'}
                        </Typography>
                    </Box>
                </Stack>
            ),
        };

        txNode.subRows.push(billRow);
    }

    // finalize totals + counts di tx level
    // @ts-ignore
    for (const tx of txMap.values()) {
        tx.billsCount = tx.subRows.length;
        tx.total = tx.subRows.reduce((a, b) => a + b.grandTotal, 0);
    }

    return Array.from(txMap.values());
}

/* ============== Export helpers (flatten tree) ============== */
type ExportRow = {
    level: 'TRANSACTION' | 'BILL' | 'ITEM';
    invoice?: string;
    bill?: string;
    orderType?: string | null;
    title?: string;   // item name
    qty?: number | '';
    price?: number | '';
    subTotal?: number | '';
    taxPct?: string | '';
    paid?: string | '';
    txGrandTotal?: number | '';
    billGrandTotal?: number | '';
};

const flattenForExport = (txRows: TxRow[]): ExportRow[] => {
    const out: ExportRow[] = [];
    for (const tx of txRows) {
        // TRANSACTION
        out.push({
            level: 'TRANSACTION',
            invoice: tx.invoice,
            orderType: tx.orderType,
            txGrandTotal: tx.total,
            billGrandTotal: '',
            bill: '',
            title: '',
            qty: '',
            price: '',
            subTotal: '',
            taxPct: '',
            paid: '',
        });

        for (const b of tx.subRows) {
            // BILL
            out.push({
                level: 'BILL',
                invoice: tx.invoice,
                bill: b.billNo,
                orderType: tx.orderType,
                billGrandTotal: b.grandTotal,
                txGrandTotal: '',
                title: '',
                qty: '',
                price: '',
                subTotal: '',
                taxPct: `${Math.round(b.taxRate * 100)}%`,
                paid: b.paid ? 'Paid' : 'Unpaid',
            });

            for (const it of b.subRows) {
                // ITEM
                out.push({
                    level: 'ITEM',
                    invoice: tx.invoice,
                    bill: b.billNo,
                    title: it.title,
                    qty: it.qty,
                    price: it.price,
                    subTotal: it.subTotal,
                    orderType: '',
                    txGrandTotal: '',
                    billGrandTotal: '',
                    taxPct: '',
                    paid: '',
                });
            }
        }
    }
    return out;
};

// hitung total dari semua transaksi (hindari double-count dari bills/items)
const calcOverallTxTotal = (tree: TxRow[]) =>
    (tree ?? []).reduce((sum, tx) => sum + (tx.total || 0), 0);

const csvConfig = mkConfig({
    useKeysAsHeaders: true,
    fieldSeparator: ',',
    decimalSeparator: '.',
    filename: 'transactions-bills-items',
});

const handleExportCSV = (tree: TxRow[]) => {
    const rows = flattenForExport(tree);
    const overallTxTotal = calcOverallTxTotal(tree);

    // header sesuai PDF
    const headers = [
        'Level',
        'Invoice',
        'Bill',
        'Order Type',
        'Title (Item)',
        'Qty',
        'Price',
        'Sub-Total',
        'Tax %',
        'Paid',
        'Tx Grand',
        'Bill Grand',
    ];

    const dataRows = rows.map((r) => ({
        Level: r.level,
        Invoice: r.invoice ?? '',
        Bill: r.bill ?? '',
        'Order Type': r.orderType ?? '',
        'Title (Item)': r.title ?? '',
        Qty: r.qty === '' ? '' : String(r.qty),
        Price: r.price === '' ? '' : String(r.price),
        'Sub-Total': r.subTotal === '' ? '' : String(r.subTotal),
        'Tax %': r.taxPct ?? '',
        Paid: r.paid ?? '',
        'Tx Grand': r.txGrandTotal === '' ? '' : String(r.txGrandTotal),
        'Bill Grand': r.billGrandTotal === '' ? '' : String(r.billGrandTotal),
    }));

    // tambahkan baris kosong + baris total (angka masuk kolom "Tx Grand")
    dataRows.push({
        // @ts-ignore
        Level: '', Invoice: '', Bill: '', 'Order Type': '',
        'Title (Item)': '', Qty: '', Price: '', 'Sub-Total': '',
        'Tax %': '', Paid: '', 'Tx Grand': '', 'Bill Grand': '',
    });

    dataRows.push({
        // @ts-ignore
        Level: '', Invoice: '', Bill: '', 'Order Type': '',
        'Title (Item)': 'AKUMULASI TOTAL',
        Qty: '', Price: '', 'Sub-Total': '', 'Tax %': '', Paid: '',
        'Tx Grand': String(overallTxTotal),
        'Bill Grand': '',
    });

    const csv = generateCsv({
        fieldSeparator: ',',
        decimalSeparator: '.',
        useKeysAsHeaders: true, // gunakan keys object sebagai header
    })(dataRows);

    download({
        fieldSeparator: ',',
        decimalSeparator: '.',
        useKeysAsHeaders: true,
        filename: 'transactions-bills-items',
    })(csv);
};


const handleExportPDF = (tree: TxRow[]) => {
    const rows = flattenForExport(tree);
    const overallTxTotal = calcOverallTxTotal(tree);

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [330, 216], // F4 landscape
    });

    const head = [[
        'Level','Invoice','Bill','Order Type','Title (Item)',
        'Qty','Price','Sub-Total','Tax %','Paid','Tx Grand','Bill Grand',
    ]];

    const body = rows.map((r) => ([
        r.level,
        r.invoice ?? '',
        r.bill ?? '',
        r.orderType ?? '',
        r.title ?? '',
        r.qty === '' ? '' : String(r.qty),
        r.price === '' ? '' : fmtID(Number(r.price)),
        r.subTotal === '' ? '' : fmtID(Number(r.subTotal)),
        r.taxPct ?? '',
        r.paid ?? '',
        r.txGrandTotal === '' ? '' : fmtID(Number(r.txGrandTotal)),
        r.billGrandTotal === '' ? '' : fmtID(Number(r.billGrandTotal)),
    ]));

    const foot = [[
        { content: 'AKUMULASI TOTAL', colSpan: 11, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: fmtID(overallTxTotal), styles: { halign: 'right', fontStyle: 'bold' } },
        { content: '' },
    ]];

    autoTable(doc, {
        head,
        body,
        // @ts-ignore
        foot,
        showFoot: 'lastPage',               // <<— hanya tampil di halaman terakhir
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [33,150,243] },
        footStyles: { fillColor: [33,150,243] },
        margin: { top: 12, left: 8, right: 8, bottom: 10 },
        theme: 'grid',
        didParseCell: (data) => {
            if (data.section === 'body') {
                const level = data.row.raw?.[0];
                if (level === 'TRANSACTION') {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [240,248,255];
                } else if (level === 'BILL') {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [248,248,248];
                } else if (level === 'ITEM' && data.column.index === 5) {
                    data.cell.text = ['   • ' + (data.cell.text?.[0] ?? '')];
                }
            }
        },
    });

    doc.save('transactions-bills-items-F4-landscape.pdf');
};

/* ============== Main component ============== */
export default function TransactionsWithBillsTree() {
    const [rows, setRows] = React.useState<TxRow[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // state untuk export dropdown
    const [exportAnchor, setExportAnchor] = React.useState<null | HTMLElement>(null);
    const openExport = (e: React.MouseEvent<HTMLButtonElement>) => setExportAnchor(e.currentTarget);
    const closeExport = () => setExportAnchor(null);

    const fetchAll = React.useCallback(() => {
        if (!window?.api?.invoke) { setError('Bridge tidak tersedia'); setRows([]); return; }
        setLoading(true);
        window.api
            .invoke<any, ApiBillsResponse>('api.transaction.bills:read.all', {})
            .then((res) => {
                const data = Array.isArray(res?.data) ? res.data : [];
                setRows(mapToTree(data));
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setError(err?.msg ?? 'Gagal memuat data');
                setRows([]);
            })
            .finally(() => setLoading(false));
    }, []);

    React.useEffect(() => { fetchAll(); }, [fetchAll]);

    /* ============== Columns ============== */
    const columns = React.useMemo<MRT_ColumnDef<AnyRow>[]>(() => [
        {
            id: 'tree',
            header: 'TRANSACTION / BILL / ITEM',
            size: 420,
            Cell: ({ row }) => (row.original as AnyRow as TxRow | BillRow | ItemRow).node,
            muiTableBodyCellProps: ({ row }) =>
                row.depth === 0 ? {} : ({ sx: { borderLeft: (t) => `3px solid ${t.palette.divider}` } }),
        },
        {
            id: 'info',
            header: 'INFO',
            size: 260,
            Cell: ({ row }) => {
                const o = row.original as AnyRow;
                if ((o as TxRow).kind === 'tx') {
                    const tx = o as TxRow;
                    return (
                        <Stack direction="row" spacing={1}>
                            <Chip size="small" variant="outlined" label={`${tx.billsCount} Bill`} sx={{ borderRadius: 2 }} />
                            <Chip size="small" variant="outlined" label={tx.orderType ?? '—'} sx={{ borderRadius: 2 }} />
                        </Stack>
                    );
                }
                if ((o as BillRow).kind === 'bill') {
                    const b = o as BillRow;
                    return (
                        <Stack direction="row" spacing={1}>
                            <Chip size="small" label={b.paid ? 'Paid' : 'Unpaid'} color={b.paid ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 2 }} />
                            <Chip size="small" variant="outlined" label={`Tax ${Math.round(b.taxRate * 100)}%`} sx={{ borderRadius: 2 }} />
                        </Stack>
                    );
                }
                const it = o as ItemRow;
                return (
                    <Typography variant="body2" color="text.secondary" noWrap title={it.title}>
                        Qty {it.qty}
                    </Typography>
                );
            },
        },
        {
            id: 'total',
            header: 'TOTAL',
            size: 160,
            muiTableBodyCellProps: { align: 'right' },
            muiTableHeadCellProps: { align: 'right' },
            Cell: ({ row }) => {
                const o = row.original as AnyRow;
                if ((o as TxRow).kind === 'tx') {
                    return <Typography variant="body2" fontWeight={700}>{fmtID((o as TxRow).total)}</Typography>;
                }
                if ((o as BillRow).kind === 'bill') {
                    const b = o as BillRow;
                    return (
                        <Stack alignItems="flex-end" spacing={0}>
                            <Typography variant="body2">{fmtID(b.total)}</Typography>
                            <Typography variant="caption" color="text.secondary">Grand {fmtID(b.grandTotal)}</Typography>
                        </Stack>
                    );
                }
                const it = o as ItemRow;
                return <Typography variant="body2">{fmtID(it.subTotal)}</Typography>;
            },
        },
    ], []);

    const table = useMaterialReactTable({
        columns,
        data: rows as AnyRow[],
        enableExpanding: true,
        enableExpandAll: false,
        paginateExpandedRows: false,
        filterFromLeafRows: true,
        getSubRows: (row: AnyRow) => (row as TxRow).subRows ?? (row as BillRow).subRows ?? undefined,
        initialState: { density: 'comfortable' },
        state: { showProgressBars: loading },
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
                    <Typography variant="overline" color="text.secondary">Transactions / Bills / Items (Tree)</Typography>
                    {loading ? (
                        <Typography variant="body2" color="text.secondary">Loading…</Typography>
                    ) : error ? (
                        <Typography variant="body2" color="error.main">{error}</Typography>
                    ) : null}
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<RefreshRounded />} onClick={fetchAll}>Refresh</Button>

                    {/* === Export Dropdown === */}
                    <React.Fragment>
                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadIcon />}
                            endIcon={<ArrowDropDownRounded />}
                            onClick={openExport}
                        >
                            Export
                        </Button>
                        <Menu
                            anchorEl={exportAnchor}
                            open={Boolean(exportAnchor)}
                            onClose={closeExport}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem onClick={() => { closeExport(); handleExportCSV(rows); }}>
                                <ListItemIcon><TableViewRounded fontSize="small" /></ListItemIcon>
                                <ListItemText
                                    primary="CSV (Spreadsheet)"
                                    secondary="Cocok untuk Excel/Google Sheets. Termasuk baris 'AKUMULASI TOTAL'."
                                />
                            </MenuItem>
                            <MenuItem onClick={() => { closeExport(); handleExportPDF(rows); }}>
                                <ListItemIcon><PictureAsPdfRounded fontSize="small" /></ListItemIcon>
                                <ListItemText
                                    primary="PDF (F4 Landscape)"
                                    secondary="Tabel rapi; footer total hanya di halaman terakhir."
                                />
                            </MenuItem>
                        </Menu>
                    </React.Fragment>
                    {/* === End Export Dropdown === */}
                </Stack>
            </Stack>
        ),
    });

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <MaterialReactTable table={table} />
        </Box>
    );
}
