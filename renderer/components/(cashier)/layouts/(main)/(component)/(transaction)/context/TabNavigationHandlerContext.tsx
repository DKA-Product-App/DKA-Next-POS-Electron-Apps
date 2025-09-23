'use client';

import * as React from 'react';

export type TabNavigationModel = {
    active : string,
    id?: string
}
// ✅ biar bisa pakai setLayout(prev => ...)
export type TabNavigationHandlerCtx = {
    state: TabNavigationModel;
    setState: React.Dispatch<React.SetStateAction<TabNavigationModel>>;
};

const TabNavigationHandlerContext = React.createContext<TabNavigationHandlerCtx | undefined>(undefined);

export function TabNavigationHandlerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<TabNavigationModel>({ active: "orders", id: null});

    const value = React.useMemo(() => ({ state, setState }), [state]);

    return (
        <TabNavigationHandlerContext.Provider value={value}>
            {children}
        </TabNavigationHandlerContext.Provider>
    );
}

export function useTabNavigationHandlerContext() {
    const ctx = React.useContext(TabNavigationHandlerContext);
    if (!ctx) throw new Error('useTabNavigationHandlerContext must be used within <TabNavigationHandlerContextProvider>');
    return ctx;
}
