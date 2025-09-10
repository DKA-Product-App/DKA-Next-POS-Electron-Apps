'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

type FunctionKeyEvent = {
    key?: string           // "F1"..."F12"
    seq: number            // auto-increment setiap event
    at: number             // timestamp (Date.now())
}

type FunctionKeyContextValue = FunctionKeyEvent

const FunctionKeyContext = createContext<FunctionKeyContextValue | undefined>(undefined)

export function FunctionKeyProvider({ children }: { children: React.ReactNode }) {
    const seqRef = useRef(0)
    const [evt, setEvt] = useState<FunctionKeyEvent>({ key: undefined, seq: 0, at: Date.now() })

    useEffect(() => {
        if (typeof window === 'undefined' || !window.ipc) return

        const handler = (args: string) => {
            const k = String(args)
            const nextSeq = ++seqRef.current

            // Update SELALU baru → memicu re-render walau key sama
            setEvt({ key: k, seq: nextSeq, at: Date.now() })

            // forward ke main process kalau perlu
            window.ipc.send('function-key', k)
        }

        window.ipc.on('function-key', handler)

        return () => {
            // revoke sekali saat provider unmount
            window.ipc.revoke?.('function-key')
        }
    }, [])

    const value = useMemo(() => evt, [evt.seq]) // depend ke seq supaya konsumsi lean

    return (
        <FunctionKeyContext.Provider value={value}>
            {children}
        </FunctionKeyContext.Provider>
    )
}

// ======== Hooks pemakaian dasar ==========
export function useFunctionKey() {
    const ctx = useContext(FunctionKeyContext)
    if (!ctx) throw new Error('useFunctionKey must be used inside FunctionKeyProvider')
    return ctx
}

// ======== Hook event-style (recommended) ==========
/**
 * Panggil callback SETIAP kali ada function key (termasuk jika key sama berulang).
 * Contoh:
 *   useOnFunctionKey(({key}) => { if(key==='F8') toggleDevtools() })
 */
export function useOnFunctionKey(callback: (e: FunctionKeyEvent) => void) {
    const evt = useFunctionKey()
    const cbRef = useRef(callback)
    useEffect(() => { cbRef.current = callback }, [callback])

    useEffect(() => {
        if (evt.seq > 0) cbRef.current(evt)
    }, [evt.seq]) // trigger on every event
}
