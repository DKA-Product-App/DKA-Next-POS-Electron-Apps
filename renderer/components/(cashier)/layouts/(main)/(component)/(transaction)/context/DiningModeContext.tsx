'use client';

import * as React from 'react';

type DiningModeCtx = {
    defaultValue: string | null;
    setDefaultValue: (s: string | null) => void;
    disableOtherDefault: boolean;
    setDisableOtherDefault: (b: boolean) => void;
};

const DiningModeContext = React.createContext<DiningModeCtx | undefined>(undefined);

export function DiningModeProvider({ children }: { children: React.ReactNode }) {
    const [defaultValue, setDefaultValue] = React.useState<string | null>(null);
    const [disableOtherDefault, setDisableOtherDefault] = React.useState<boolean>(false);

    const value = React.useMemo(() => ({
        defaultValue,
        setDefaultValue,
        disableOtherDefault,
        setDisableOtherDefault,
    }), [defaultValue, disableOtherDefault]);

    return <DiningModeContext.Provider value={value}>{children}</DiningModeContext.Provider>;
}

export function useDiningMode() {
    const ctx = React.useContext(DiningModeContext);
    if (!ctx) throw new Error('useDiningMode must be used within <DiningModeProvider>');
    return ctx;
}
