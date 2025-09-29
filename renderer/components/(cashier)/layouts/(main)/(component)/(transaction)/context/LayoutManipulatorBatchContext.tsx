'use client';

import * as React from 'react';

// ✅ biar bisa pakai setLayout(prev => ...)
export type LayoutManipulatorBatchCtx = {
    layout: React.ReactNode | null;
    setLayout: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

const LayoutManipulatorBatchContext = React.createContext<LayoutManipulatorBatchCtx | undefined>(undefined);

export function LayoutManipulatorBatchProvider({ children }: { children: React.ReactNode }) {
    const [layout, setLayout] = React.useState<React.ReactNode | null>(null);

    const value = React.useMemo(() => ({ layout, setLayout }), [layout]);

    return (
        <LayoutManipulatorBatchContext.Provider value={value}>
            {children}
        </LayoutManipulatorBatchContext.Provider>
    );
}

export function useLayoutManipulatorBatch() {
    const ctx = React.useContext(LayoutManipulatorBatchContext);
    if (!ctx) throw new Error('useLayoutManipulatorBatch must be used within <LayoutManipulatorBatchProvider>');
    return ctx;
}
