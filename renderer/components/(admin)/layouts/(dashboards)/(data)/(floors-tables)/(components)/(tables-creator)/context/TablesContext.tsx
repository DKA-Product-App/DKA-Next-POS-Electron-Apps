'use client';

import * as React from 'react';

/* ==== Shared Types (sinkron dengan TableLayoutCreator) ==== */
export type Shape = 'rect' | 'round';
export type TableDraft = {
    id: string;
    serverId?: string;   // ada = existing server (locked)
    label: string;
    capacity: number;
    shape: Shape;
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
    rot?: number;
    locked?: boolean;
};
export type FloorDraft = { id: string; name?: string; tables: TableDraft[] };

type DraftDict = Record<string, TableDraft[]>;

type Ctx = {
    currentFloorId: string;
    setCurrentFloorId: (id: string) => void;

    /** hanya meja baru (bukan locked) per lantai */
    drafts: DraftDict;
    /** sinkronisasi dari Canvas kiri */
    syncDrafts: (floorId: string, tables: TableDraft[]) => void;

    /** selection id (shared kiri-kanan) */
    selected: string[];
    setSelected: (ids: string[]) => void;

    /** helper mutasi sederhana untuk kanan */
    updateDraft: (floorId: string, id: string, patch: Partial<TableDraft>) => void;
    removeDraft: (floorId: string, ids: string[]) => void;
};

const TablesCtx = React.createContext<Ctx | null>(null);

function reducer(state: { drafts: DraftDict; currentFloorId: string; selected: string[] }, action: any) {
    if (action.type === 'setFloor') return { ...state, currentFloorId: action.id };
    if (action.type === 'syncDrafts') {
        if (!action.floorId) return state;
        const same = state.drafts[action.floorId] && state.drafts[action.floorId].length === action.tables.length &&
            state.drafts[action.floorId].every((t, i) => t.id === action.tables[i]?.id && t.x === action.tables[i]?.x && t.y === action.tables[i]?.y && t.rot === action.tables[i]?.rot);
        return same ? state : { ...state, drafts: { ...state.drafts, [action.floorId]: action.tables } };
    }
    if (action.type === 'setSelected') return { ...state, selected: action.ids || [] };
    if (action.type === 'updateDraft') {
        const arr = state.drafts[action.floorId] || [];
        const next = arr.map(t => t.id === action.id ? { ...t, ...action.patch } : t);
        return { ...state, drafts: { ...state.drafts, [action.floorId]: next } };
    }
    if (action.type === 'removeDraft') {
        const arr = state.drafts[action.floorId] || [];
        const set = new Set(action.ids || []);
        const next = arr.filter(t => !set.has(t.id));
        const nextSel = state.selected.filter(id => !set.has(id));
        return { ...state, drafts: { ...state.drafts, [action.floorId]: next }, selected: nextSel };
    }
    return state;
}

export function TablesCreatorProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = React.useReducer(reducer, { drafts: {}, currentFloorId: '', selected: [] });

    const ctx: Ctx = React.useMemo(() => ({
        currentFloorId: state.currentFloorId,
        setCurrentFloorId: (id) => dispatch({ type: 'setFloor', id }),

        drafts: state.drafts,
        syncDrafts: (floorId, tables) => dispatch({ type: 'syncDrafts', floorId, tables }),

        selected: state.selected,
        setSelected: (ids) => dispatch({ type: 'setSelected', ids }),

        updateDraft: (floorId, id, patch) => dispatch({ type: 'updateDraft', floorId, id, patch }),
        removeDraft: (floorId, ids) => dispatch({ type: 'removeDraft', floorId, ids }),
    }), [state]);

    return <TablesCtx.Provider value={ctx}>{children}</TablesCtx.Provider>;
}

export const useTablesCtx = () => {
    const v = React.useContext(TablesCtx);
    if (!v) throw new Error('useTablesCtx must be used inside TablesCreatorProvider');
    return v;
};
