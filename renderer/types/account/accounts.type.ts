import {ConfigBranch} from "../config/base/branch.type";
import {ConfigShift} from "../config/data/shift.type";
import {AccountsRole} from "./accounts.roles.type";


export interface Accounts {
    id?: string;
    reference?: Accounts;
    branches?: ConfigBranch[];
    name?: {
        first_name?: string;
        last_name?: string;
    };
    shift?: ConfigShift;
    username?: string;
    password?: string;
    roles?: AccountsRole[],
    time_created?: string; // ISO
    time_updated?: string; // ISO
    time_deleted?: string | null; // bisa null
}

export interface ApiAccountsResponse {
    status: boolean;
    code: number;
    msg: string;
    data: Accounts[];
}