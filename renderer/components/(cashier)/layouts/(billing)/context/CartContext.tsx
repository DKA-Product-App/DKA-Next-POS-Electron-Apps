'use client'

import React from 'react'
import type { Products } from '../types/products.type'
import type { ProductsVariants } from '../types/products.variants.type'

export type CartItem = {
    key: string
    productId: string
    name: string
    variantLabel?: string
    unitPrice: number
    qty: number
    description?: string
}

type CartState = {
    items: CartItem[]
    taxRate: number
}

type Action =
    | { type: 'ADD'; payload: { p: Products; v?: ProductsVariants } }
    | { type: 'INC'; payload: { key: string } }
    | { type: 'DEC'; payload: { key: string } }
    | { type: 'REMOVE'; payload: { key: string } }
    | { type: 'CLEAR' }
    | { type: 'SET_TAX_RATE'; payload: { taxRate: number } }
    | { type: 'SET_DESC'; payload: { key: string; description: string } }

const STORAGE_KEY = 'cashier_cart'
const STORAGE_VERSION = 1

const CartStateCtx = React.createContext<CartState | null>(null)
const CartActionsCtx = React.createContext<{
    add: (p: Products, v?: ProductsVariants) => void
    inc: (key: string) => void
    dec: (key: string) => void
    remove: (key: string) => void
    clear: () => void
    setTaxRate: (n: number) => void
    setDescription: (key: string, description: string) => void
} | null>(null)

// ---------- Reducer ----------
const reducer = (state: CartState, action: Action): CartState => {
    if (action.type === 'ADD') {
        const { p, v } = action.payload
        const key = `${p.id}:${v?.id ?? 'base'}`
        const unitPrice = v?.price ?? (p as any).price ?? 0
        const variantLabel = v?.name

        const items = state.items.some(i => i.key === key)
            ? state.items.map(it => (it.key === key ? { ...it, qty: it.qty + 1 } : it))
            : state.items.concat([
                { key, productId: p.id, name: p.name, variantLabel, unitPrice, qty: 1 },
            ])
        return { ...state, items }
    }

    if (action.type === 'INC') {
        const items = state.items.map(it =>
            it.key === action.payload.key ? { ...it, qty: it.qty + 1 } : it
        )
        return { ...state, items }
    }

    if (action.type === 'DEC') {
        const items = state.items
            .map(it => (it.key === action.payload.key ? { ...it, qty: it.qty - 1 } : it))
            .filter(it => it.qty > 0)
        return { ...state, items }
    }

    if (action.type === 'REMOVE') {
        const items = state.items.filter(it => it.key !== action.payload.key)
        return { ...state, items }
    }

    if (action.type === 'CLEAR') return { ...state, items: [] }

    if (action.type === 'SET_TAX_RATE') return { ...state, taxRate: action.payload.taxRate }

    if (action.type === 'SET_DESC') {
        const items = state.items.map(it =>
            it.key === action.payload.key ? { ...it, description: action.payload.description } : it
        )
        return { ...state, items }
    }

    return state
}

// ---------- Storage helpers ----------
type PersistedState = { version: number; payload: CartState }

const loadInitialState = (initialTaxRate: number): CartState => {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
    if (!raw) return { items: [], taxRate: initialTaxRate }

    const parsed = JSON.parse(raw) as PersistedState | CartState
    // Backward compatibility (tanpa version)
    const state: CartState =
        'version' in (parsed as any)
            ? (parsed as PersistedState).payload
            : (parsed as CartState)

    return {
        items: state.items ?? [],
        taxRate: typeof state.taxRate === 'number' ? state.taxRate : initialTaxRate,
    }
}

const persist = (state: CartState) => {
    const data: PersistedState = { version: STORAGE_VERSION, payload: state }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ---------- Provider ----------
export const CartProvider: React.FC<{
    children: React.ReactNode
    initialTaxRate?: number
}> = ({ children, initialTaxRate = 0.11 }) => {
    // Lazy init agar rehydrate dilakukan sekali, tanpa dispatch tambahan
    const [state, dispatch] = React.useReducer(
        reducer,
        undefined as unknown as CartState,
        () => loadInitialState(initialTaxRate)
    )

    // Persist setiap perubahan state
    React.useEffect(() => {
        if (typeof window === 'undefined') return
        persist(state)
    }, [state])

    // Actions stabil (tidak berubah referensi) karena hanya bergantung pada dispatch
    const valueActions = React.useMemo(
        () => ({
            add: (p: Products, v?: ProductsVariants) =>
                dispatch({ type: 'ADD', payload: { p, v } }),
            inc: (key: string) => dispatch({ type: 'INC', payload: { key } }),
            dec: (key: string) => dispatch({ type: 'DEC', payload: { key } }),
            remove: (key: string) => dispatch({ type: 'REMOVE', payload: { key } }),
            clear: () => dispatch({ type: 'CLEAR' }),
            setTaxRate: (n: number) =>
                dispatch({ type: 'SET_TAX_RATE', payload: { taxRate: n } }),
            setDescription: (key: string, description: string) =>
                dispatch({ type: 'SET_DESC', payload: { key, description } }),
        }),
        [dispatch]
    )

    return (
        <CartStateCtx.Provider value={state}>
            <CartActionsCtx.Provider value={valueActions}>
                {children}
            </CartActionsCtx.Provider>
        </CartStateCtx.Provider>
    )
}

// ---------- Hooks konsumen ----------
export const useCart = () => {
    const ctx = React.useContext(CartStateCtx)
    if (!ctx) throw new Error('useCart must be used within CartProvider')
    return ctx
}

export const useCartActions = () => {
    const ctx = React.useContext(CartActionsCtx)
    if (!ctx) throw new Error('useCartActions must be used within CartProvider')
    return ctx
}

export const useCartMoney = () => {
    const { items, taxRate } = useCart()
    const subtotal = React.useMemo(
        () => items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0),
        [items]
    )
    const tax = React.useMemo(() => Math.round(subtotal * taxRate), [subtotal, taxRate])
    const total = subtotal + tax
    const rupiahFmt = React.useMemo(
        () =>
            new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0,
            }),
        []
    )
    const rupiah = (n: number) => rupiahFmt.format(n)
    const taxRatePct = Math.round(taxRate * 100)
    return { subtotal, tax, total, rupiah, taxRatePct }
}
