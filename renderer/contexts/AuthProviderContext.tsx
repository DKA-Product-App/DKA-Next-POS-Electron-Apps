'use client';

import * as React from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useMemo, useRef, useCallback} from 'react';
import normalizeIpcError from '../helpers/electronMessageErrorEsctration';
import {useSession} from './SessionProviderContext';

export type AuthData = {
    token?: string | undefined;
    roles?: Array<{ code: string | undefined; name: string | undefined }>;
};

export type AuthCtx = {
    Auth: AuthData | null;
    setAuth: React.Dispatch<React.SetStateAction<AuthData | null>>;
    setLogout: () => void;
};

const AuthContext = React.createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [Auth, setAuth] = React.useState<AuthData | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { setSession } = useSession();

    // Cegah double-verify di StrictMode/Fast Refresh
    const verifyingRef = useRef(false);

    // Logout yang bener: clear state + pindah ke /auth kalau belum di sana
    const setLogout = useCallback(() => {
        setSession(null);
        setAuth(null); // lebih bersih daripada {token: undefined, roles: undefined}
        if (!pathname?.includes('/auth')) router.replace('/auth');
    }, [pathname, router, setSession]);

    useEffect(() => {
        // Kalau bukan halaman /auth dan gak ada token => pastikan logout sekali, lalu stop
        if (!pathname?.includes('/auth') && !Auth?.token) {
            setLogout();
            return;
        }

        // Kalau di /auth tapi gak ada token => gak usah verifikasi
        if (pathname?.includes('/auth') && !Auth?.token) return;

        // Ada token? verifikasi, tapi jangan dobel
        if (Auth?.token) {
            if (verifyingRef.current) return;
            verifyingRef.current = true;
            window?.api?.invoke?.('api.auth:verify', Auth)
                .then((result: any) => {
                    console.log(result);
                    setSession(result?.data ?? null);
                })
                .catch((error: any) => {
                    // Log kalau perlu
                    void normalizeIpcError(error);
                    setLogout();
                })
                .finally(() => {
                    verifyingRef.current = false;
                });
        }
    }, [Auth, pathname, setLogout, setSession]);

    const value = useMemo(() => ({ Auth, setAuth, setLogout }), [Auth, setLogout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
