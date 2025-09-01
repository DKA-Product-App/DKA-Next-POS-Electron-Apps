
export type UUID = string;

export interface TimeStamp {
    unix: number;
    humanize: string;
}

export interface AccountsInfo {
    first_name: string;
    last_name: string;
    status: boolean;
    time_created: TimeStamp;
}

export interface AccountsPlace {
    status: boolean;
    address: string;
    postal_code: string;
    time_created: TimeStamp;
}


export interface AccountsCredential {
    email : string;
    username: string;
}

export interface Accounts {
    status: boolean;
    id: UUID;
    credential: AccountsCredential;
    info: AccountsInfo;
    place: AccountsPlace;
    time_created: TimeStamp;
}