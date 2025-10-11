'use client'

import React from 'react'
import {ProductsVariants} from "../../../../../types/product/products.variants.type";
import {Products} from "../../../../../types/product/products.type";

/* =========================
 *  TIPE DATA BARU
 * ========================= */
export type CartItem = {
    key: string
    variant: ProductsVariants
    price: number
    qty: number
    note?: string
}

type CartState = {
    items: CartItem[]
    onSubmit: (() => void) | undefined
}

type Action =
    | { type: 'ADD'; payload: { p: Products; v?: ProductsVariants } }
    | { type: 'INC'; payload: { key: string } }
    | { type: 'DEC'; payload: { key: string } }
    | { type: 'REMOVE'; payload: { key: string } }
    | { type: 'CLEAR' }
    | { type: 'SET_DESC'; payload: { key: string; description: string } } // tetap kompatibel – map ke "note"

const CartStateCtx = React.createContext<CartState | null>(null)
const CartActionsCtx = React.createContext<{
    add: (p: Products, v?: ProductsVariants) => void
    inc: (key: string) => void
    dec: (key: string) => void
    remove: (key: string) => void
    clear: () => void
    setDescription: (key: string, description: string) => void
} | null>(null)

/* =========================
 *  HELPERS
 * ========================= */
const numberFromMoney = (n: unknown): number =>
    typeof n === 'number' ? n : typeof n === 'string' ? Number(n) : 0

// fallback bikin "varian base" kalau user belum milih varian
const makeBaseVariant = (p: Products): ProductsVariants =>
    ({
        id: `${(p as any).id ?? 'unknown'}:BASE`,
        code: 'BASE',
        name: 'Default',
        description: (p as any).description ?? 'Base variant',
        price: (p as any).price ?? 0,
        product: { id: (p as any).id, name: (p as any).name },
    } as unknown as ProductsVariants)

/* =========================
 *  REDUCER
 * ========================= */
const reducer = (state: CartState, action: Action): CartState => {
    if (action.type === 'ADD') {
        const { p } = action.payload
        const v = action.payload.v ?? makeBaseVariant(p)
        const key = v.id
        const price = numberFromMoney((v as any).price)

        const items = state.items.some(i => i.key === key)
            ? state.items.map(it => (it.key === key ? { ...it, qty: it.qty + 1 } : it))
            : state.items.concat([{ key, variant: v, price, qty: 1 }])

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

    if (action.type === 'SET_DESC') {
        const items = state.items.map(it =>
            it.key === action.payload.key ? { ...it, note: action.payload.description } : it
        )
        return { ...state, items }
    }

    return state
}

/* =========================
 *  STORAGE (NO-OP)
 * ========================= */
const loadInitialState = (): CartState => ({
    items: [],
    onSubmit: undefined,
})

/* =========================
 *  PROVIDER
 * ========================= */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = React.useReducer(
        reducer,
        undefined as unknown as CartState,
        loadInitialState
    )

    const valueActions = React.useMemo(
        () => ({
            add: (p: Products, v?: ProductsVariants) => dispatch({ type: 'ADD', payload: { p, v } }),
            inc: (key: string) => dispatch({ type: 'INC', payload: { key } }),
            dec: (key: string) => dispatch({ type: 'DEC', payload: { key } }),
            remove: (key: string) => dispatch({ type: 'REMOVE', payload: { key } }),
            clear: () => dispatch({ type: 'CLEAR' }),
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

/* =========================
 *  HOOKS
 * ========================= */
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
    const { items } = useCart()

    const subtotal = React.useMemo(
        () => items.reduce((acc, it) => acc + it.price * it.qty, 0),
        [items]
    )

    // TANPA TAX: total = subtotal
    const total = subtotal

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

    return { subtotal, total, rupiah }
}
