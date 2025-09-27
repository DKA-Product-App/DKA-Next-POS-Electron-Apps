// Biar eksplisit kalau ini UUID, tapi tetap string di runtime
import {AccountDataItem} from "../../../../../../../types/Accounts.type";
import {Organization, Project} from "../../../../../../../types/Enterprises.type";

export type UUID = string;

export interface TimeStamp {
    unix: number;
    humanize: string;
}

export interface ProductsCategories {
    id: UUID;
    reference?: AccountDataItem;
    organization?: Organization;
    project?: Project;
    name: string;
    description: string;
    time_created: TimeStamp;
    status: boolean;
}
