'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

/* =========================
   Types
   ========================= */

export type FnKey = `F${1|2|3|4|5|6|7|8|9|10|11|12}`
export type Shortcut = { key: FnKey; label: string; }

type FunctionKeyContextValue = {
    /** last pressed info */
    key?: FnKey
    seq: number
    at: number

    /** sorted menu F1..F12 */
    menu: Shortcut[]

    /** CRUD (immutables, no for-loops) */
    add: (s: Shortcut) => void
    update: (key: FnKey, patch: Partial<Shortcut>) => void
    remove: (key: FnKey) => void
    move: (fromIdx: number, toIdx: number) => void
    setMenu: React.Dispatch<React.SetStateAction<Shortcut[]>>
}


const CHANNEL = 'shortcut'
const ALLOWED = new Set(Array.from({ length: 12 }, (_, i) => `F${i + 1}` as FnKey))

const DEFAULT_MENU: Shortcut[] = [
    { key: 'F7', label: 'Layar Penuh' },
]

const sortMenu = (arr: Shortcut[]) =>
    [...arr].sort((a, b) => Number(a.key.slice(1)) - Number(b.key.slice(1)))

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* =========================
   Context
   ========================= */

const FunctionKeyContext = createContext<FunctionKeyContextValue | undefined>(undefined)

/* =========================
   Provider
   ========================= */

export function FunctionKeyProvider({
                                        children,
                                        initialMenu,
                                    }: {
    children: React.ReactNode
    /** seed optional (tetap in-memory, no persistence) */
    initialMenu?: Shortcut[]
}) {
    const seqRef = useRef(0)
    const [last, setLast] = useState<{ key?: FnKey; seq: number; at: number }>({ key: undefined, seq: 0, at: Date.now() })
    const [rawMenu, setRawMenu] = useState<Shortcut[]>(
        () => (initialMenu?.length ? initialMenu : DEFAULT_MENU)
    )

    // subscribe event dari preload
    useEffect(() => {
        if (typeof window === 'undefined' || !window.shortcut?.on) return
        const off = window.shortcut.on(CHANNEL, (payload: any) => {
            const k = (typeof payload === 'string' ? payload : payload?.key) as FnKey
            if (!k || !ALLOWED.has(k)) return
            const nextSeq = ++seqRef.current
            setLast({ key: k, seq: nextSeq, at: Date.now() })
        })
        return () => { typeof off === 'function' ? off() : undefined }
    }, [])

    /** CRUD */
    const add = (s: Shortcut) =>
        setRawMenu(prev => (!ALLOWED.has(s.key) || prev.some(x => x.key === s.key)) ? prev : [...prev, s])

    const update = (key: FnKey, patch: Partial<Shortcut>) =>
        setRawMenu(prev => prev.map(x => x.key === key ? ({ ...x, ...patch, key: (patch.key ?? x.key) as FnKey }) : x))

    const remove = (key: FnKey) =>
        setRawMenu(prev => prev.filter(x => x.key !== key))

    const move = (fromIdx: number, toIdx: number) =>
        setRawMenu(prev => {
            const arr = [...prev]
            const [it] = arr.splice(clamp(fromIdx, 0, arr.length - 1), 1)
            return it ? (arr.splice(clamp(toIdx, 0, arr.length), 0, it), arr) : prev
        })

    /** menu yang di-expose: SELALU urut F1..F12 */
    const menu = useMemo(() => sortMenu(rawMenu), [rawMenu])

    const value = useMemo<FunctionKeyContextValue>(
        () => ({ key: last.key, seq: last.seq, at: last.at, menu, add, update, remove, move, setMenu: setRawMenu }),
        [last.seq, last.at, last.key, menu]
    )

    return <FunctionKeyContext.Provider value={value}>{children}</FunctionKeyContext.Provider>
}

/* =========================
   Hooks
   ========================= */

export const useFunctionKeyCtx = () => {
    const ctx = useContext(FunctionKeyContext)
    if (!ctx) throw new Error('useFunctionKeyCtx must be used inside FunctionKeyProvider')
    return ctx
}

/** Listener simple: dipanggil setiap ada key baru (berdasar seq naik) */
export const useOnFunctionKey = (cb: (e: { key?: FnKey; seq: number; at: number }) => void) => {
    const { key, seq, at } = useFunctionKeyCtx()
    const ref = useRef(cb)
    useEffect(() => { ref.current = cb }, [cb])
    useEffect(() => { seq > 0 ? ref.current({ key, seq, at }) : undefined }, [seq, key, at])
}
