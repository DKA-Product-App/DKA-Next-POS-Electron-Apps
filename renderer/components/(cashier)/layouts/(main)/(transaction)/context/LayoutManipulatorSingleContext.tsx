'use client';

import * as React from 'react';

// ✅ biar bisa pakai setLayout(prev => ...)
export type LayoutManipulatorSingleCtx = {
    layout: React.ReactNode | null;
    setLayout: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

const LayoutManipulatorSingleContext = React.createContext<LayoutManipulatorSingleCtx | undefined>(undefined);

export function LayoutManipulatorSingleProvider({ children }: { children: React.ReactNode }) {
    const [layout, setLayout] = React.useState<React.ReactNode | null>(null);

    const value = React.useMemo(() => ({ layout, setLayout }), [layout]);

    return (
        <LayoutManipulatorSingleContext.Provider value={value}>
            {children}
        </LayoutManipulatorSingleContext.Provider>
    );
}

export function useLayoutManipulatorSingle() {
    const ctx = React.useContext(LayoutManipulatorSingleContext);
    if (!ctx) throw new Error('useLayoutManipulatorSingle must be used within <LayoutManipulatorSingleProvider>');
    return ctx;
}
