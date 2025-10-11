import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../base/branch.type";
import {FloorsTables} from "./floors.tables.type";


/**
 * ini adalah Interface type Floors
 * **/
export interface ConfigFloors {
    id?: string;
    reference?: Accounts;
    branches?: Array<ConfigBranch>;
    code?: string;
    name?: string;
    tables?: FloorsTables;
    description?: string;
    time_created?: string;
    time_updated?: string;
    time_deleted?: string;
    status?: string;
}