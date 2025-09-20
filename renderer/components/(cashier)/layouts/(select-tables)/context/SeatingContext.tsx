'use client';

import * as React from 'react';

export type TableStatus = 'available' | 'reserved' | 'occupied';
export type FloorLevel = string; // dinamis dari REST

export type SelectedTable = {
    floor: FloorLevel;
    tableId: string;
    label: string;
    capacity: number;
    status: TableStatus;
} | null;

export type Shape = 'round' | 'rectangle';
export type Table2D = {
    id: string;                 // untuk UI/seleksi (code || id)
    serverId: string;           // UUID asli dari REST
    label: string;
    shape: Shape;
    capacity: number;
    status: TableStatus;
    x: number; y: number; w?: number; h?: number; r?: number; rot?: number;
};

type SeatingCtx = {
    selection: SelectedTable;
    setSelection: (s: SelectedTable) => void;
    floor: FloorLevel;
    setFloor: (f: FloorLevel) => void;

    floors: { id: FloorLevel; name: string }[];
    tablesByFloor: Record<FloorLevel, Table2D[]>;
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
    refresh: () => void;
};

const SeatingContext = React.createContext<SeatingCtx | undefined>(undefined);

type ServerTable = {
    id: string;                 // UUID
    code: string;
    name: string;
    shape?: 'RECTANGLE' | 'ROUND' | string;
    capacity: number;
    coordinate?: { x?: number; y?: number };
    dimension?: { width?: number; height?: number; rotate?: number };
    state?: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | string;
    floor?: { code?: string; name?: string };
};

const mapStatus = (s?: string): TableStatus =>
    s === 'RESERVED' ? 'reserved' : s === 'OCCUPIED' ? 'occupied' : 'available';

const mapShape = (s?: string): Shape =>
    s?.toUpperCase() === 'ROUND' ? 'round' : 'rectangle';

const normalizeTables = (rows: ServerTable[]): Record<string, Table2D[]> =>
    rows.reduce<Record<string, Table2D[]>>((acc, t) => {
        const floorId = (t.floor?.code || 'L1').toString();
        const status = mapStatus(t.state);
        const shape = mapShape(t.shape);
        const x = t.coordinate?.x ?? 0;
        const y = t.coordinate?.y ?? 0;
        const rot = t.dimension?.rotate ?? 0;

        const w = t.dimension?.width && t.dimension?.width > 0 ? t.dimension.width : 100;
        const h = t.dimension?.height && t.dimension?.height > 0 ? t.dimension.height : 60;
        const r = shape === 'round' ? Math.max(35, Math.min(70, Math.round((t.capacity ?? 2) * 12))) : undefined;

        const node: Table2D = {
            id: t.code || t.id,         // nice human code untuk UI
            serverId: t.id,             // UUID asli REST
            label: t.name || t.code || 'Meja',
            shape,
            capacity: t.capacity ?? 2,
            status,
            x, y,
            w: shape === 'rectangle' ? w : undefined,
            h: shape === 'rectangle' ? h : undefined,
            r,
            rot
        };

        acc[floorId] = (acc[floorId] || []).concat(node);
        return acc;
    }, {});

export function SeatingProvider({ children }: { children: React.ReactNode }) {
    const [selection, setSelection] = React.useState<SelectedTable>(null);
    const [floor, setFloor] = React.useState<FloorLevel>(''); // default: kosong, biar kontrol lantai gak muncul dulu

    const [floors, setFloors] = React.useState<{ id: FloorLevel; name: string }[]>([]);
    const [tablesByFloor, setTablesByFloor] = React.useState<Record<FloorLevel, Table2D[]>>({});
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = React.useState<number | null>(null);

    // load awal (gaya then/catch/finally)
    React.useEffect(() => {
        setLoading(true);
        setError(null);
        // @ts-ignore
        window.api?.invoke('api.config.data.floors.tables:read.all', {})
            .then((result: { data: ServerTable[] }) => Array.isArray(result?.data) ? result.data : [])
            .then((rows: ServerTable[]) => {
                const grouped = normalizeTables(rows);
                const list = Array.from(
                    new Map(
                        rows.map(r => {
                            const id = (r.floor?.code || 'L1').toString();
                            const name = (r.floor?.name || id).toString();
                            return [id, { id, name }];
                        })
                    ).values()
                );
                setTablesByFloor(grouped);
                setFloors(list);
                setLastUpdated(Date.now());
            })
            .catch((e) => {
                setTablesByFloor({});
                setFloors([]);
                setError(e?.message || 'Failed to load tables');
            })
            .finally(() => setLoading(false));
    }, []);

    // biarkan floor kosong bila belum dipilih/valid — no auto-set
    React.useEffect(() => {
        const valid = floor && floors.some(f => f.id === floor);
        valid ? null : null;
    }, [floors, floor]);

    // auto-clear selection kalau meja hilang di snapshot baru
    React.useEffect(() => {
        if (!selection) return;
        const list = tablesByFloor[selection.floor] || [];
        list.some(t => t.id === selection.tableId) ? null : setSelection(null);
    }, [tablesByFloor, selection]);

    // refresh manual
    const refresh = React.useCallback(() => {
        setLoading(true);
        setError(null);
        // @ts-ignore
        window.api?.invoke('api.config.data.floors.tables:read.all', {})
            .then((result: { data: ServerTable[] }) => Array.isArray(result?.data) ? result.data : [])
            .then((rows: ServerTable[]) => {
                const grouped = normalizeTables(rows);
                const list = Array.from(
                    new Map(
                        rows.map(r => {
                            const id = (r.floor?.code || 'L1').toString();
                            const name = (r.floor?.name || id).toString();
                            return [id, { id, name }];
                        })
                    ).values()
                );
                setTablesByFloor(grouped);
                setFloors(list);
                setLastUpdated(Date.now());
            })
            .catch((e) => {
                setTablesByFloor({});
                setFloors([]);
                setError(e?.message || 'Failed to load tables');
            })
            .finally(() => setLoading(false));
    }, []);

    const value = React.useMemo(
        () => ({ selection, setSelection, floor, setFloor, floors, tablesByFloor, loading, error, lastUpdated, refresh }),
        [selection, floor, floors, tablesByFloor, loading, error, lastUpdated, refresh]
    );

    return <SeatingContext.Provider value={value}>{children}</SeatingContext.Provider>;
}

export function useSeating() {
    const ctx = React.useContext(SeatingContext);
    if (!ctx) throw new Error('useSeating must be used within <SeatingProvider>');
    return ctx;
}
