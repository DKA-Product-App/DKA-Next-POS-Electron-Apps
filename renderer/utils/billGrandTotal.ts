import type { TransactionBill } from '../types/transaction/bill/transaction.bill.type'

/** `bill.tax` dari server: 0.1 = 10%, atau 10 = 10% */
export function resolveTaxRate(tax?: number | null): number {
    if (tax == null || Number.isNaN(Number(tax))) return 0.1
    const n = Number(tax)
    return n > 1 ? n / 100 : n
}

export function sumBillItemsSubtotal(bill?: TransactionBill | null): number {
    return (bill?.items ?? []).reduce((a, i) => a + Number(i.sub_total ?? 0), 0)
}

export function resolveBillDiscountAmount(bill: TransactionBill, itemsSubtotal: number): number {
    const stored = Number(bill.discount_amount ?? 0)
    if (stored > 0) return Math.min(itemsSubtotal, stored)

    const voucherValue = Number(bill.voucher_value ?? 0)
    if (!voucherValue) return 0

    const voucherType = bill.voucher_type ?? 'fixed'
    if (voucherType === 'percentage') {
        return Math.min(itemsSubtotal, Math.round(itemsSubtotal * (voucherValue / 100)))
    }
    return Math.min(itemsSubtotal, voucherValue)
}

/** Grand total bill: (subtotal - diskon) + pajak atas dasar setelah diskon. */
export function resolveBillGrandTotal(bill: TransactionBill, itemsSubtotal?: number): number {
    const sub = itemsSubtotal ?? sumBillItemsSubtotal(bill)
    if (sub <= 0) return 0

    const discount = resolveBillDiscountAmount(bill, sub)
    const taxRate = resolveTaxRate(bill.tax)
    const tax = Math.max(0, Math.round((sub - discount) * taxRate))
    return Math.max(0, sub - discount + tax)
}
