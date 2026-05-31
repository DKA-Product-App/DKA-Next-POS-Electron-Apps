import type { TransactionBill } from '../types/transaction/bill/transaction.bill.type'
import type { TransactionBillItem } from '../types/transaction/bill/transaction.bill.item.type'
import type { Transaction } from '../types/transaction/transaction.type'

export type BillLineItem = {
    id: string
    qty: number
    price: number
    sub_total: number
    bill: string | number
    status?: boolean
    time_created?: string
    time_updated?: string
    reference?: TransactionBillItem['reference']
    variant: TransactionBillItem['productVariant']
}

/** God mode ON: hanya item status true (merah). OFF: semua item. */
export function deriveLineItems(
    bill?: TransactionBill,
    godMode?: boolean | null,
): BillLineItem[] {
    return (bill?.items ?? [])
        .filter((wrap) => (godMode ? wrap.status === true : true))
        .map((wrap) => {
            const it = wrap.productVariant
            return {
                id: String(wrap.id ?? Math.random()),
                qty: Number(wrap.qty ?? 0),
                price: Number(wrap.price ?? 0),
                sub_total: Number(wrap.sub_total ?? 0),
                bill: bill?.bill ?? '# -',
                status: wrap.status,
                time_created: wrap.time_created,
                time_updated: wrap.time_updated,
                reference: wrap.reference,
                variant: it,
            }
        })
}

export function countBillLineItems(bill?: TransactionBill, godMode?: boolean | null) {
    const items = deriveLineItems(bill, godMode)
    const qtyTotal = items.reduce((a, it) => a + Number(it.qty ?? 0), 0)
    return { itemsCount: items.length, qtyTotal }
}

/** Variant id → total qty (untuk matching bill vs checkout). */
export function foldVariantQty<
    T extends { variant?: { id?: string }; productVariant?: { id?: string }; qty?: unknown },
>(arr: T[]): string {
    const acc = (arr ?? []).reduce<Record<string, number>>((m, d) => {
        const id = String(d?.variant?.id ?? d?.productVariant?.id ?? '')
        if (!id) return m
        const q = Number(d?.qty ?? 0) || 0
        m[id] = (m[id] || 0) + q
        return m
    }, {})
    return Object.entries(acc)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([id, q]) => `${id}:${q}`)
        .join('|')
}

export function pickUnpaidBills(transaction?: Transaction): TransactionBill[] {
    return (transaction?.bills ?? []).filter(
        (b) => !b?.time_deleted && !b?.paid?.status,
    )
}

/**
 * Full checkout: reuse bill unpaid yang sudah mencakup item checkout (hindari bill #4963 duplikat).
 */
export function findReusableUnpaidBillId(
    transaction: Transaction | undefined,
    checkoutBatchItemIds: string[],
): string | undefined {
    const unpaidBills = pickUnpaidBills(transaction)
    if (!unpaidBills.length || !checkoutBatchItemIds.length) return undefined

    const batchItems = (transaction?.batches ?? []).flatMap((b) => b?.items ?? [])
    const checkoutRows = checkoutBatchItemIds
        .map((id) => batchItems.find((it) => String(it?.id) === String(id)))
        .filter(Boolean) as typeof batchItems

    if (checkoutRows.length !== checkoutBatchItemIds.length) return undefined

    const checkoutFold = foldVariantQty(checkoutRows)
    if (!checkoutFold) return undefined

    const matches = unpaidBills.filter((bill) => {
        const billFold = foldVariantQty(bill?.items ?? [])
        return billFold === checkoutFold
    })

    if (matches.length === 1) return matches[0].id

    // Satu bill unpaid + checkout subset (semua variant di bill)
    if (unpaidBills.length === 1) {
        const bill = unpaidBills[0]
        const billVariantQty = (bill?.items ?? []).reduce<Record<string, number>>((m, it) => {
            const id = String(it?.productVariant?.id ?? '')
            if (!id) return m
            m[id] = (m[id] || 0) + (Number(it?.qty ?? 0) || 0)
            return m
        }, {})
        const checkoutVariantQty = checkoutRows.reduce<Record<string, number>>((m, it) => {
            const id = String(it?.variant?.id ?? '')
            if (!id) return m
            m[id] = (m[id] || 0) + (Number(it?.qty ?? 0) || 0)
            return m
        }, {})

        const covered = Object.entries(checkoutVariantQty).every(
            ([vid, q]) => (billVariantQty[vid] ?? 0) >= q,
        )
        if (covered) return bill.id
    }

    return undefined
}
