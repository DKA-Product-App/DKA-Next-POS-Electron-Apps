import {AccountDataItem} from "../../../../../types/Accounts.type";
import {Organization, Project} from "../../../../../types/Enterprises.type";
import {Products} from "./products.type";

export type UUID = string;

export interface TimeStamp {
    unix: number;
    humanize: string;
}

export interface ProductsVariants {
    id: UUID;
    reference?: AccountDataItem;
    organization?: Organization;
    project?: Project;
    product?: Products;
    code?: string;
    name: string;
    description: string;
    price : number;
    time_created: TimeStamp;
    status: boolean;
}