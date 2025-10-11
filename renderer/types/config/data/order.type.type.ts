/* ===== Util Types ===== */
import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../base/branch.type";

/* ===== Main Type ===== */
/** Mode pemesanan (Dine-In/Take Away/Delivery, dsb) */
export interface ConfigOrderType {
    id?: string;
    code?: string;                      // contoh: "TAKE_AWAY"
    name?: string;                      // contoh: "TAKE AWAY"
    icon?: string | null;              // contoh: "takeout_dining" (Material Icon name)
    description?: string | null;       // contoh: "Bungkus / Ambil Ditempat"
    required_table_select?: boolean;    // dine-in biasanya true, take-away false
    status?: boolean;                   // aktif/non-aktif

    time_created: string;
    time_updated: string;
    time_deleted: string | null;

    reference?: Accounts;           // who created/updated
    branches: ConfigBranch[];            // cabang yang berlaku
}
