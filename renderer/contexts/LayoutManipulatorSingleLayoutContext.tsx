'use client';

import * as React from 'react';

// ✅ biar bisa pakai setLayout(prev => ...)
export type LayoutManipulatorSingleLayoutCtx = {
    layout: React.ReactNode | null;
    setLayout: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

const LayoutManipulatorSingleLayoutContext = React.createContext<LayoutManipulatorSingleLayoutCtx | undefined>(undefined);

export function LayoutManipulatorSingleLayoutProvider({ children }: { children: React.ReactNode }) {
    const [layout, setLayout] = React.useState<React.ReactNode | null>(null);

    const value = React.useMemo(() => ({ layout, setLayout }), [layout]);

    return (
        <LayoutManipulatorSingleLayoutContext.Provider value={value}>
            {children}
        </LayoutManipulatorSingleLayoutContext.Provider>
    );
}

export function useLayoutManipulatorSingleLayout() {
    const ctx = React.useContext(LayoutManipulatorSingleLayoutContext);
    if (!ctx) throw new Error('useLayoutManipulatorSingleLayout must be used within <LayoutManipulatorSingleLayoutProvider>');
    return ctx;
}
