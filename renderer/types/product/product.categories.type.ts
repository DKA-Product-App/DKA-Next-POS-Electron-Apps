// products-categories.types.ts

/* ===== Common ===== */
import {DevicePrinter} from "../config/device/device.printer.type";

export type UUID = string;
export type ISODateString = string;

/* ===== Nested Refs ===== */
export interface AccountNameRef {
    first_name?: string;
    last_name?: string;
}

export interface AccountRef {
    id: UUID;
    name?: AccountNameRef;
    username?: string;
    password?: string;
    time_created: ISODateString;
    time_updated: ISODateString;
    time_deleted: ISODateString | null;
}

export interface BranchRef {
    id: UUID;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    time_created: ISODateString;
    time_updated: ISODateString;
    time_deleted: ISODateString | null;
}

/* ===== Main Entity ===== */
export interface ProductsCategories {
    id: UUID;
    name: string;
    description?: string | null;
    time_created: ISODateString;
    time_updated: ISODateString;
    time_deleted: ISODateString | null;
    status: boolean;
    reference?: AccountRef;
    branches?: BranchRef[];
    /** daftar printer yang terasosiasi dengan kategori ini */
    printer?: DevicePrinter[];
}
