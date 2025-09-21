'use client'

import * as React from 'react'

type Reason = 'batch' | 'split' | 'pay' | 'void' | 'manual'

type Ctx = {
    token: number
    reason: Reason | null
    bump: (r?: Reason) => void
}

const TransactionEventTriggerContext = React.createContext<Ctx | null>(null)

export const TransactionEventTriggerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [token, setToken] = React.useState(0)
    const [reason, setReason] = React.useState<Reason | null>(null)

    const bump = React.useCallback<Ctx['bump']>((r = 'manual') => {
        setReason(r)
        setToken(Date.now())
    }, [])

    const value = React.useMemo(() => ({ token, reason, bump }), [token, reason, bump])
    return <TransactionEventTriggerContext.Provider value={value}>{children}</TransactionEventTriggerContext.Provider>
}

export const useTransactionEventTrigger = () => {
    const ctx = React.useContext(TransactionEventTriggerContext)
    if (!ctx) throw new Error('useTransactionEventTrigger must be used within <TransactionEventTriggerProvider>')
    return ctx
}
