export type UUID = string;

export interface TimeStamp {
    unix: number;
    humanize: string;
}



export interface EnterpriseContact {
    phone: string;
    email: string;
    address: string;
}

export interface Organization {
    id: UUID;
    reference: UUID;
    name: string;
    description: string;
    contact: EnterpriseContact;
    time_created: TimeStamp;
    status: boolean;
}

export interface Project {
    id: UUID;
    reference: UUID;
    organization?: Organization;
    name: string;
    description: string;
    contact: EnterpriseContact;
    time_created: TimeStamp;
    status: boolean;
}