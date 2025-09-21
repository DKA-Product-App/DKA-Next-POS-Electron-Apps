'use client'

import * as React from 'react'

/* ====== Minimal types (sinkron dg pane) ====== */
export type Name = { first_name: string; last_name?: string }
export type Reference = { id: string; name?: Name; username?: string }
export type OrderType = { id: string; code: string; name: string }
export type Table = { id: string; code: string; name: string }
export type Product = { id: string; name: string; description?: string; image?: string }
export type Variant = { id: string; code?: string; name?: string; price?: string }
export type Item = { id: string; qty: number; price: string; sub_total: string; note?: string | null; reference?: Reference | null; product: Product; variant?: Variant }

export type TxHeader = {
    id?: string
    batch?: any
    invoice?: string
    total?: string
    time_closed?: string | null
    reference?: Reference
    shift?: { id: string; name: string }
    order_type?: OrderType
    table?: Table
}

type Ctx = {
    txId: string
    header: TxHeader
    setHeader: (p: Partial<TxHeader>) => void
    grandTotal: number
    setGrandTotal: (t: number) => void
    selectedBatchId?: string
    setSelectedBatchId: (id?: string) => void
    selectedItemIds: Set<string>
    toggleItem: (item: Item) => void
    clearSelection: () => void

    // Items cache per batch → utk hitung total terpilih secara global
    registerItems: (batchId: string, items: Item[]) => void
    itemsByBatch: Record<string, Item[]>
    selectedTotal: number

    // Trigger refetch pane
    reloadKey: number
    bumpReload: () => void

    // NEW: setter langsung buat reloadKey (nama yang kamu minta)
    setReloadkey: React.Dispatch<React.SetStateAction<number>>
    // NEW (opsional/alias): versi camelCase standar
    setReloadKey: React.Dispatch<React.SetStateAction<number>>
}

const TxContext = React.createContext<Ctx | null>(null)

export function useTx() {
    const ctx = React.useContext(TxContext)
    if (!ctx) throw new Error('useTx must be used within TxProvider')
    return ctx
}

export function TxProvider({ txId, children }: { txId: string; children: React.ReactNode }) {
    const [header, setHeaderState] = React.useState<TxHeader>({})
    const [grandTotal, setGrandTotalState] = React.useState(0)
    const [selectedBatchId, setSelectedBatchId] = React.useState<string | undefined>(undefined)
    const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(new Set())
    const [itemsByBatch, setItemsByBatch] = React.useState<Record<string, Item[]>>({})
    const [reloadKey, setReloadKey] = React.useState(0)

    const setHeader = (p: Partial<TxHeader>) => setHeaderState(h => ({ ...h, ...p }))
    const setGrandTotal = (num: number) => setGrandTotalState(num)
    const bumpReload = () => setReloadKey(k => k + 1)

    const registerItems = (batchId: string, items: Item[]) =>
        setItemsByBatch(prev => ({ ...prev, [batchId]: items }))

    const toggleItem = (item: Item, batchId?: string) => {
        const key = batchId ? `${batchId}:${item.id}` : item.id
        setSelectedItemIds(prev => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }
    const clearSelection = () => setSelectedItemIds(new Set())

    const selectedTotal = React.useMemo(() => {
        if (selectedItemIds.size === 0) return 0
        let sum = 0
        const index: Record<string, Item> = {}
        Object.values(itemsByBatch).forEach(arr => arr.forEach(it => { index[it.id] = it }))
        selectedItemIds.forEach(id => {
            const it = index[id]
            if (it) sum += parseFloat(it.sub_total || '0')
        })
        return sum
    }, [selectedItemIds, itemsByBatch])

    const value = React.useMemo<Ctx>(() => ({
        txId,
        header, setHeader,
        grandTotal, setGrandTotal,
        selectedBatchId, setSelectedBatchId,
        selectedItemIds, toggleItem, clearSelection,
        registerItems, itemsByBatch, selectedTotal,
        reloadKey, bumpReload,
        // NEW: expose setter (dua nama, sama-sama ke setReloadKey state)
        setReloadkey: setReloadKey,
        setReloadKey: setReloadKey,
    }), [
        txId, header, grandTotal, selectedBatchId, selectedItemIds, itemsByBatch, selectedTotal, reloadKey
    ])

    return <TxContext.Provider value={value}>{children}</TxContext.Provider>
}
