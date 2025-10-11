import {Accounts} from "../../account/accounts.type";
import {ConfigCorporation} from "./corporation.type";

export interface ConfigBranch {
    id?: string,
    reference?: Accounts;
    corporation?: ConfigCorporation;
    name?: string,
    address?: string,
    phone?: string,
    email?: string,
    website?: null,
    time_created?: string,
    time_updated?: string,
    time_deleted?: null,
}

export interface ApiConfigBranchResponse {
    status: boolean;
    code: number;
    msg: string;
    data: ConfigBranch[];
}