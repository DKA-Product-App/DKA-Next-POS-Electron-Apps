export interface DevicePrinterOptions {
    /** Mode koneksi printer (contoh data: "NETWORK") */
    mode: 'NETWORK' | 'USB' | 'SERIAL' | 'BLUETOOTH' | (string & {});
    port?: number;
    timeout?: number;
    ip_address?: string;
}

export interface DevicePrinter {
    id?: string;
    name?: string;
    description?: string | null;
    options?: DevicePrinterOptions;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string;
    status?: boolean;
}