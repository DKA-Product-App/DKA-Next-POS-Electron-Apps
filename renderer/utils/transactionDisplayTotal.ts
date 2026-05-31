import type { SummarizeTxReturn } from '../components/(cashier)/layouts/(main)/(component)/(transaction)/types/transaction.read.one.type'

/**
 * Total yang ditampilkan di kartu transaksi.
 * `batchItems.active` = 0 bila semua item sudah masuk bill paid (transaksi selesai).
 */
export function resolveTransactionDisplayTotal(
    meta?: SummarizeTxReturn,
    isClosed?: boolean,
): number {
    if (!meta?.raw) return 0
    const { raw } = meta
    const active = Number(raw.batchItems.active.price) || 0
    const grandBills = Number(raw.bills.grandTotalActive) || 0
    const allItems = Number(raw.batchItems.all.price) || 0
    const paidBills = raw.payments.paidBillsCount ?? 0

    if (isClosed || (active === 0 && paidBills > 0)) {
        return grandBills > 0 ? grandBills : allItems
    }
    return active > 0 ? active : grandBills
}
