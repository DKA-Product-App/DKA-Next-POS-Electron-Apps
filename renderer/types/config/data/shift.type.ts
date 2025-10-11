/* ============================================
 * Shift API Types (standalone)
 * Root: ApiShift
 * ============================================ */


import {Accounts} from "../../account/accounts.type";
import {ConfigBranch} from "../base/branch.type";

/** ==== ROOT TYPE: ApiShift ==== */
export interface ConfigShift {
    id: string;
    name: string;            // contoh: "PAGI"
    start_time: string;      // "HH:MM" → contoh: "07:00"
    end_time: string;        // "HH:MM" → contoh: "14:59"
    status?: boolean;        // true
    time_created?: string;   // ISO string
    time_updated?: string;   // ISO string
    time_deleted?: string | null;
    reference?: Accounts;   // creator/updater
    branches?: ConfigBranch[];      // daftar cabang yang ter-assign
    accounts?: Accounts[];  // akun-akun yang terkait shift
}

/* (Opsional) wrapper response dari API
export interface ApiShiftResponse {
  status: boolean;
  code: number;
  msg: string;
  data: ApiShift | ApiShift[];
}
*/
