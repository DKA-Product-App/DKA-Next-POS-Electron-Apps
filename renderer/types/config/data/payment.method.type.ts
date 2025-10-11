import {ConfigBranch} from "../base/branch.type";
import {Accounts} from "../../account/accounts.type";


export interface ConfigPaymentMethod {
    id: string,
    icon: string,
    name: string,
    description: string,
    need_tender: boolean,
    time_created: string,
    time_updated: string,
    time_deleted: string,
    status: boolean,
    reference: Accounts,
    branches: Array<ConfigBranch>
}