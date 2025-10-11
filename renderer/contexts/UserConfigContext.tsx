'use client';

import * as React from 'react';
import { merge } from 'lodash';
import {DevicePrinter} from "../types/config/device/device.printer.type";

/* ========= Types ========= */
export type PrinterConfig = {
    isPrintAutomatically: boolean;
    defaultPrinter?: DevicePrinter | undefined;
};

export type SessionConfig = {
    isAutologoutShift: boolean;
    isRememberLoginUsername: boolean;
};

export type UserConfig = {
    printer: PrinterConfig;
    session: SessionConfig;
};

const DEFAULT_CONFIG: UserConfig = {
    printer: { isPrintAutomatically: true, defaultPrinter: undefined },
    session: { isAutologoutShift: false, isRememberLoginUsername: true },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K] };

/* ========= Storage (single JSON) ========= */
const STORAGE_KEY = 'userConfig.v1';

const load = (): UserConfig =>
    typeof window === 'undefined'
        ? DEFAULT_CONFIG
        : (JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') ?? DEFAULT_CONFIG);

const save = (cfg: UserConfig) =>
    typeof window !== 'undefined' ? window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)) : undefined;

const clear = () =>
    typeof window !== 'undefined' ? window.localStorage.removeItem(STORAGE_KEY) : undefined;

/* ========= Type guard utk bedain full vs partial ========= */
const isFullConfig = (v: unknown): v is UserConfig =>
    !!v &&
    typeof v === 'object' &&
    'printer' in (v as any) &&
    'session' in (v as any);

/* ========= Context Value (sesuai request) ========= */
export type UserConfigContextValue = {
    config: UserConfig;
    /** set bisa full config, partial config (deep), atau function(prev) -> full/partial */
    set: (
        next:
            | UserConfig
            | DeepPartial<UserConfig>
            | ((prev: UserConfig) => UserConfig | DeepPartial<UserConfig>)
    ) => void;
    reset: () => void;
};

const Ctx = React.createContext<UserConfigContextValue | undefined>(undefined);

/* ========= Provider ========= */
export function UserConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, _setConfig] = React.useState<UserConfig>(load);
    const mounted = React.useRef(false);

    // initial mount sync (sekali)
    React.useEffect(() => {
        if (mounted.current) return;
        mounted.current = true;
        _setConfig(load());
    }, []);

    // cross-tab sync
    React.useEffect(() => {
        const onStorage = (e: StorageEvent) => (e.key === STORAGE_KEY ? _setConfig(load()) : undefined);
        typeof window !== 'undefined' ? window.addEventListener('storage', onStorage) : undefined;
        return () => (typeof window !== 'undefined' ? window.removeEventListener('storage', onStorage) : undefined);
    }, []);

    const set: UserConfigContextValue['set'] = React.useCallback((next) => {
        _setConfig(prev => {
            const base = prev ?? load();
            const candidate = typeof next === 'function' ? (next as any)(base) : next;
            const result = isFullConfig(candidate) ? candidate : merge({}, base, candidate);
            save(result);
            return result;
        });
    }, []);

    const reset = React.useCallback(() => {
        clear();
        _setConfig({ ...DEFAULT_CONFIG });
        save(DEFAULT_CONFIG);
    }, []);

    const value = React.useMemo<UserConfigContextValue>(() => ({ config, set, reset }), [config, set, reset]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ========= Hook ========= */
export function useUserConfig() {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error('useUserConfig must be used within <UserConfigProvider>');
    return ctx;
}

/* ===== Contoh pakai =====
const { config, set, reset } = useUserConfig();
// partial patch:
set({ printer: { defaultPrinter: 'POS-58' }});
// functional:
set(prev => ({ session: { isAutologoutShift: !prev.session.isAutologoutShift } }));
// full replace:
set({ printer: { isPrintAutomatically: true, defaultPrinter: 'EPSON-TM' }, session: { isAutologoutShift: true, isRememberLoginUsername: true }});
// reset:
reset();
*/
