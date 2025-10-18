import {ConfigBranch} from "../base/branch.type";
import {Accounts} from "../../account/accounts.type";

export interface DevicePrinterOptions {
    /** Mode koneksi printer (contoh data: "NETWORK") */
    mode: 'NETWORK' | 'USB' | 'SERIAL' | 'BLUETOOTH' | (string & {});
    port?: number;
    timeout?: number;
    ip_address?: string;
}

export interface DevicePrinter {
    id?: string;
    reference?: Accounts;
    branches?: ConfigBranch[];
    name?: string;
    description?: string | null;
    options?: DevicePrinterOptions;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string;
    status?: boolean;
}