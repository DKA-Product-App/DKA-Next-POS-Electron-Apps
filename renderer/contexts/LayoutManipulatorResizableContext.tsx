'use client';

import * as React from 'react';

export type LayoutManipulatorResizableLayout = {
    left?: React.ReactNode | undefined;
    right?: React.ReactNode | undefined;
};

// ✅ biar bisa pakai setLayout(prev => ...)
export type LayoutManipulatorResizableCtx = {
    layout: LayoutManipulatorResizableLayout | null;
    setLayout: React.Dispatch<React.SetStateAction<LayoutManipulatorResizableLayout | null>>;
};

const LayoutManipulatorResizableContext = React.createContext<LayoutManipulatorResizableCtx | undefined>(undefined);

export function LayoutManipulatorResizableProvider({ children }: { children: React.ReactNode }) {
    const [layout, setLayout] = React.useState<LayoutManipulatorResizableLayout | null>(null);

    const value = React.useMemo(() => ({ layout, setLayout }), [layout]);

    return (
        <LayoutManipulatorResizableContext.Provider value={value}>
            {children}
        </LayoutManipulatorResizableContext.Provider>
    );
}

export function useLayoutManipulatorResizable() {
    const ctx = React.useContext(LayoutManipulatorResizableContext);
    if (!ctx) throw new Error('useLayoutManipulatorResizable must be used within <LayoutManipulatorResizableProvider>');
    return ctx;
}
