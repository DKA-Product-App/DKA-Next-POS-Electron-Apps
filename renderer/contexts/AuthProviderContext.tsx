'use client';

import * as React from 'react';

export type AuthData = {
    token?: string | undefined;
    roles?: Array<{
        code: string | undefined;
        name: string | undefined;
    }>
};

// ✅ biar bisa pakai setLayout(prev => ...)
export type AuthCtx = {
    Auth: AuthData | null;
    setAuth: React.Dispatch<React.SetStateAction<AuthData | null>>;
};

const AuthContext = React.createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [Auth, setAuth] = React.useState<AuthData | null>(null);

    const value = React.useMemo(() => ({ Auth, setAuth }), [Auth]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
