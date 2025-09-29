/* =========================================
 *  Transaction — Models (ALL OPTIONAL)
 *  Catatan: semua properti pakai "?:"
 *  Tanggal: 2025-09-29
 * ========================================= */

export interface TransactionApiResponse<T> {
    status?: boolean;
    code?: number;
    msg?: string;
    data?: T;
}

export type TransactionApiResponseList = TransactionApiResponse<Transaction[]>;

/* ========== Common / Refs ========== */

export interface TransactionName {
    first_name?: string;
    last_name?: string | null;
}

export interface TransactionAccount {
    id?: string;
    name?: TransactionName;
    username?: string;
    password?: string;
    time_created?: string;
    time_updated?: string;
}

/* ===== Tables (Floors → Tables) ===== */

export interface FloorsTablesCoordinate { x?: number; y?: number }
export interface FloorsTablesDimension { width?: number; height?: number; rotate?: number }

export interface Floors {
    id?: string;
    code?: string;
    name?: string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: TransactionAccount;
}

export type FloorsTablesShape = 'RECTANGLE' | 'CIRCLE' | 'ELLIPSE' | string;

export interface FloorsTables {
    id?: string;
    code?: string;
    name?: string;
    shape?: FloorsTablesShape;
    capacity?: number;
    coordinate?: FloorsTablesCoordinate;
    dimension?: FloorsTablesDimension;
    state?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | string;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: TransactionAccount;
    floor?: Floors;
}

/* ===== Config (Branch, Shift) ===== */

export interface ConfigShift {
    id?: string;
    name?: string;
    start_time?: string; // "07:00"
    end_time?: string;   // "14:59"
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: TransactionAccount;
}

export interface ConfigBranch {
    id?: string;
    name?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    time_created?: string;
    time_updated?: string;
    reference?: TransactionAccount;
}

/* ===== Order Types ===== */

export interface OrderTypes {
    id?: string;
    code?: string;              // "DINE_IN"
    name?: string;              // "DINE IN"
    icon?: string;
    description?: string | null;
    required_table_select?: boolean;
    status?: boolean;
    time_created?: string;
    time_updated?: string;
    reference?: TransactionAccount;
}

/* ===== Catalog (Product, Category, Printer, Variant) ===== */

export interface ProductCategoriesPrintersOptions {
    mode?: 'NETWORK' | 'USB' | 'SERIAL' | string;
    port?: number;
    timeout?: number;
    ip_address?: string;
}

export interface ProductCategoriesPrinters {
    id?: string;
    name?: string;
    description?: string | null;
    options?: ProductCategoriesPrintersOptions;
    time_created?: string;
    time_updated?: string;
    status?: boolean;
}

export interface ProductCategories {
    id?: string;
    name?: string;
    description?: string | null;
    time_created?: string;
    time_updated?: string;
    status?: boolean;
    printer?: ProductCategoriesPrinters[];
}

export interface Products {
    id?: string;
    name?: string;
    description?: string | null;
    image?: string | null;
    time_created?: string;
    time_updated?: string;
    status?: boolean;
    category?: ProductCategories[];
}

export interface ProductsVariants {
    id?: string;
    code?: string;
    name?: string;
    description?: string | null;
    price?: string; // "25000.00"
    time_created?: string;
    time_updated?: string;
}

/* ===== Transaction Graph ===== */

export interface TransactionBatchesItemsVoid {
    id?: string;
    reason?: string | null;
    time_created?: string;
    time_updated?: string;
    is_approved?: boolean;
}

export interface TransactionBatchesItems {
    id?: string;
    qty?: number;
    batch?: TransactionBatches;
    price?: string;      // "45000.00"
    sub_total?: string;  // "135000.00"
    note?: string | null;
    time_created?: string;
    time_updated?: string;

    reference?: TransactionAccount;
    product?: Products;
    variant?: ProductsVariants;

    /** null jika tidak void; objek jika item di-void */
    void?: TransactionBatchesItemsVoid | null;
}

export interface TransactionBatches {
    id?: string;
    transaction?: Transaction;
    batch?: number;
    note?: string | null;
    time_created?: string;
    time_updated?: string;
    reference?: TransactionAccount;
    items?: TransactionBatchesItems[];
}

/** Snapshot minimal item saat masuk bill */
export interface TransactionBillsItemsTransactionItemRef {
    id?: string;
    qty?: number;
    price?: string;
    sub_total?: string;
    note?: string | null;
    time_created?: string;
    time_updated?: string;
}

export interface TransactionBillsItems {
    id?: string;
    qty?: number;
    price?: string;      // "0.00"
    sub_total?: string;  // "0.00"
    time_created?: string;
    time_updated?: string;
    transactionItem?: TransactionBillsItemsTransactionItemRef;
}

export interface TransactionBills {
    id?: string;
    number?: string; // "9"
    paid?: { time?: string | null; status?: boolean };
    time_created?: string;
    time_updated?: string;
    items?: TransactionBillsItems[];
}

/* ===== Root ===== */

export interface Transaction {
    id?: string;
    invoice?: string;
    time_created?: string;
    time_updated?: string;
    time_closed?: string | null;

    reference?: TransactionAccount;

    /** Branch disajikan array oleh API */
    branch?: ConfigBranch[];

    shift?: ConfigShift;
    order_type?: OrderTypes;
    table?: FloorsTables;

    batches?: TransactionBatches[];
    bills?: TransactionBills[];
}
