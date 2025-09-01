// Biar eksplisit kalau ini UUID, tapi tetap string di runtime
import {Accounts} from "../../../types/Accounts.type";
import {Organization, Project} from "../../../types/Enterprises.type";

export type UUID = string;

export interface TimeStamp {
    unix: number;
    humanize: string;
}

export interface ProductsCategories {
    id: UUID;
    reference?: Accounts;
    organization?: Organization;
    project?: Project;
    name: string;
    description: string;
    time_created: TimeStamp;
    status: boolean;
}
