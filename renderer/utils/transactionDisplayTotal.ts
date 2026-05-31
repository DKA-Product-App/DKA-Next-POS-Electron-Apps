import type { SummarizeTxReturn } from '../components/(cashier)/layouts/(main)/(component)/(transaction)/types/transaction.read.one.type'

/**
 * Total yang ditampilkan di kartu transaksi (containerLeft).
 * Transaksi selesai: pakai grandTotalAll (semua item bill, ungu + merah).
 * grandTotalActive hanya item status true (god) — dipakai internal god-mode.
 */
export function resolveTransactionDisplayTotal(
    meta?: SummarizeTxReturn,
    isClosed?: boolean,
): number {
    if (!meta?.raw) return 0
    const { raw } = meta
    const active = Number(raw.batchItems.active.price) || 0
    const grandBillsAll = Number(raw.bills.grandTotalAll) || 0
    const grandBillsGod = Number(raw.bills.grandTotalActive) || 0
    const allItems = Number(raw.batchItems.all.price) || 0
    const paidBills = raw.payments.paidBillsCount ?? 0

    if (isClosed || (active === 0 && paidBills > 0)) {
        return grandBillsAll > 0 ? grandBillsAll : (grandBillsGod > 0 ? grandBillsGod : allItems)
    }
    return active > 0 ? active : (grandBillsAll > 0 ? grandBillsAll : grandBillsGod)
}
