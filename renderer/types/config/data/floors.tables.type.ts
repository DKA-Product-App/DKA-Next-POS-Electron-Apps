import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../base/branch.type";
import {ConfigFloors} from "./floors.type";


/** Shape & state opsional sebagai union (bisa diperluas kapan saja) */
export type TableShape = 'RECTANGLE' | 'CIRCLE' | 'OVAL' | 'SQUARE' | string;
export type TableState = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'DISABLED' | string;

/** Koordinat & dimensi untuk layouting */
export interface ApiTableCoordinate {
    x: number;
    y: number;
}
export interface ApiTableDimension {
    width: number;
    height: number;
    rotate: number; // derajat
}

export interface FloorsTables {
    id?: string;
    code?: string;                 // contoh: "T01"
    name?: string;                 // contoh: "Meja 01"
    shape?: TableShape;            // contoh: "RECTANGLE"
    capacity?: number;             // contoh: 2
    coordinate?: ApiTableCoordinate;
    dimension?: ApiTableDimension;
    state?: TableState;            // contoh: "AVAILABLE"
    status?: boolean;             // true
    time_created?: string;        // ISO
    time_updated?: string;        // ISO
    time_deleted?: string | null;
    reference?: Accounts;
    branches?: ConfigBranch[];       // daftar cabang yang punya meja ini
    floor?: ConfigFloors;             // lantai tempat meja berada
}

export interface ApiFloorsTablesResponse {
    status: boolean;
    code: number;
    msg: string;
    data: FloorsTables | FloorsTables[];
}