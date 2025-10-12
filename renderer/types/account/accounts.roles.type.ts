import {Accounts} from "./accounts.type";
import {ConfigBranch} from "../config/base/branch.type";

export interface AccountsRole {
    id?: string;
    code?: string;                    // "DEV"
    name?: string;                    // "Developer"
    description?: string | null;     // "Account tertinggi level"
    status?: boolean;                // true
    time_created?: string;           // ISO
    time_updated?: string;           // ISO
    time_deleted?: string | null;    // bisa null
    reference?: Accounts;       // creator/updater ref
    branches?: ConfigBranch[];           // [] pada sample
}

export interface ApiAccountsRolesResponse {
    status: boolean;
    code: number;
    msg: string;
    data: AccountsRole[];
}