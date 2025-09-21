'use client';

import * as React from 'react';

export type TableStatus = 'available' | 'reserved' | 'occupied';
export type FloorLevel = 'L1' | 'L2';

export type SelectedTable = {
    floor: FloorLevel;
    tableId: string;
    label: string;
    capacity: number;
    status: TableStatus;
} | null;

type SeatingCtx = {
    selection: SelectedTable;
    setSelection: (s: SelectedTable) => void;
    floor: FloorLevel;
    setFloor: (f: FloorLevel) => void;
};

const SeatingContext = React.createContext<SeatingCtx | undefined>(undefined);

export function SeatingProvider({
                                    children,
                                    initialFloor = 'L1',
                                }: {
    children: React.ReactNode;
    initialFloor?: FloorLevel;
}) {
    const [selection, setSelection] = React.useState<SelectedTable>(null);
    const [floor, setFloor] = React.useState<FloorLevel>(initialFloor);

    const value = React.useMemo(
        () => ({ selection, setSelection, floor, setFloor }),
        [selection, floor]
    );

    return <SeatingContext.Provider value={value}>{children}</SeatingContext.Provider>;
}

export function useSeating() {
    const ctx = React.useContext(SeatingContext);
    if (!ctx) throw new Error('useSeating must be used within <SeatingProvider>');
    return ctx;
}
