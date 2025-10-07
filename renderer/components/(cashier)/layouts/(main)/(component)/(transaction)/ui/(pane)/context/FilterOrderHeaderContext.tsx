'use client'

import * as React from 'react'
import { Transaction, TransactionBatches, TransactionBatchesItems, TransactionBills } from '../../types/api.transaction.type'

export type VoidFilterKey = 'pending_void' | 'voided'
export type PaidFilterKey = 'pending_paid' | 'paid' | 'unpaid'

type Ctx = {
    // state
    batch: number | 'any'
    voidFilter: VoidFilterKey[]
    paidFilter: PaidFilterKey[]

    // derived
    batches: number[]
    matchItem: (it: TransactionBatchesItems) => boolean
    selectedBatch?: TransactionBatches
    transaction: Transaction

    // actions
    setBatch: (v: number | 'any') => void
    setVoidFilter: (v: VoidFilterKey[]) => void
    setPaidFilter: (v: PaidFilterKey[]) => void
    resetAll: () => void
}

const FilterOrderHeaderContext = React.createContext<Ctx | null>(null)
export function useFilterOrderHeader() {
    const ctx = React.useContext(FilterOrderHeaderContext)
    if (!ctx) throw new Error('useFilterOrderHeader must be used within FilterOrderHeaderProvider')
    return ctx
}

/* ===== helpers ===== */
const isPendingVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved !== true
const isApprovedVoid = (it: TransactionBatchesItems) => Boolean(it?.void) && it.void!.is_approved === true

const isPendingPaid = (it: TransactionBatchesItems) => {
    const bills = it?.batch?.transaction?.bills ?? []
    return bills.some((b) =>
        (b?.paid === null || b?.paid?.status === false) &&
        (b?.items ?? []).some((bi) => bi?.productVariant?.id === it.id)
    )
}

const isPaid = (it: TransactionBatchesItems) => {
    const bills = it?.batch?.transaction?.bills ?? []
    return bills.some((b) =>
        (b?.paid?.status === true) &&
        (b?.items ?? []).some((bi) => bi?.productVariant?.id === it.id)
    )
}

const isUnpaid = (it: TransactionBatchesItems) => {
    const bills: TransactionBills[] = it?.batch?.transaction?.bills ?? []
    return !bills.some(b => (b?.items ?? []).some((bi) => bi?.productVariant?.id === it.id))
}

export function FilterOrderHeaderProvider({
                                              children,
                                              transaction,
                                          }: {
    children: React.ReactNode
    transaction: Transaction
}) {
    const [batch, setBatch] = React.useState<number | 'any'>('any')
    const [voidFilter, setVoidFilter] = React.useState<VoidFilterKey[]>([])
    const [paidFilter, setPaidFilter] = React.useState<PaidFilterKey[]>([])

    const batches = React.useMemo(() => {
        const nums = (transaction?.batches ?? [])
            .map(b => Number(b?.batch))
            .filter(n => Number.isFinite(n)) as number[]
        return Array.from(new Set(nums)).sort((a, b) => a - b)
    }, [transaction])

    const selectedBatch = React.useMemo<TransactionBatches | undefined>(() => {
        if (batch === 'any') return undefined
        return (transaction?.batches ?? []).find(b => Number(b?.batch) === Number(batch))
    }, [transaction, batch])

    const matchItem = React.useCallback((it: TransactionBatchesItems) => {
        // batch
        if (batch !== 'any' && Number(it?.batch?.batch) !== Number(batch)) return false

        // void (multi): kosong = tanpa filter
        if (voidFilter.length) {
            let ok = false
            if (voidFilter.includes('pending_void') && isPendingVoid(it)) ok = true
            if (voidFilter.includes('voided') && isApprovedVoid(it)) ok = true
            if (!ok) return false
        }

        // paid (multi)
        if (paidFilter.length) {
            let ok = false
            if (paidFilter.includes('pending_paid') && isPendingPaid(it)) ok = true
            if (paidFilter.includes('paid') && isPaid(it)) ok = true
            if (paidFilter.includes('unpaid') && isUnpaid(it)) ok = true
            if (!ok) return false
        }

        return true
    }, [batch, voidFilter, paidFilter])

    const resetAll = React.useCallback(() => {
        setBatch('any')
        setVoidFilter([])
        setPaidFilter([])
    }, [])

    const value: Ctx = {
        batch,
        voidFilter,
        paidFilter,
        batches,
        matchItem,
        selectedBatch,
        transaction,
        setBatch,
        setVoidFilter,
        setPaidFilter,
        resetAll,
    }

    return (
        <FilterOrderHeaderContext.Provider value={value}>
            {children}
        </FilterOrderHeaderContext.Provider>
    )
}
