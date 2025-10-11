'use client';

import * as React from 'react';
import {Accounts} from "../types/account/accounts.type";


// ✅ biar bisa pakai setLayout(prev => ...)
export type SessionCtx = {
    Session: Accounts | null;
    setSession: React.Dispatch<React.SetStateAction<Accounts | null>>;
};

const SessionContext = React.createContext<SessionCtx | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [Session, setSession] = React.useState<Accounts | null>(null);

    const value = React.useMemo(() => ({ Session, setSession }), [Session]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const ctx = React.useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be used within <SessionProvider>');
    return ctx;
}
