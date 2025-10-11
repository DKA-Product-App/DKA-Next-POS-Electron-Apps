import {Accounts} from "../../account/accounts.type";


export interface ConfigCorporation {
    id?: string;
    reference?: Accounts;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: null;
    time_created?: string;
    time_updated?: string;
    time_deleted?: null;
}

export interface ApiConfigCorporationResponse {
    status: boolean;
    code: number;
    msg: string;
    data: ConfigCorporation[];
}