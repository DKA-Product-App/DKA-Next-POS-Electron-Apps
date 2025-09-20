import {Accounts} from "../../../../../../types/Accounts.type";
import {Organization, Project} from "../../../../../../types/Enterprises.type";
import {ProductsCategories} from "./product.categories.type";
import {ProductsVariants} from "./products.variants.type";

export type UUID = string;

export interface TimeStamp {
    unix: number;
    humanize: string;
}
export interface Products {
    id : UUID;
    reference?: Accounts,
    organization?: Organization,
    project?: Project,
    category?: ProductsCategories,
    name: string;
    sku: string,
    description?: string,
    image?: UUID;
    variants : ProductsVariants[];
    time_created: TimeStamp,
    time_updated?: TimeStamp,
    time_deleted?: TimeStamp,
    status: boolean,
}