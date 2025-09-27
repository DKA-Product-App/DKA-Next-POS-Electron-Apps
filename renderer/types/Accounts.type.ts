// Alias biar rapi
export type UUID = string
export type ISODate = string

// Nama orang
export interface PersonName {
    last_name: string
    first_name: string
}

// Referensi user sederhana (tanpa nested "reference" lagi)
export interface AccountReference {
    id: UUID
    name: PersonName
    username: string
    password: string
    time_created: ISODate
    time_updated: ISODate
}

// Role/Peran user
export interface Role {
    id: UUID
    code: string          // contoh: "DEV"
    name: string          // contoh: "Developer"
    description: string
    status: boolean
    time_created: ISODate
    time_updated: ISODate
    reference: AccountReference
}

// Satu item pada field `data`
export interface AccountDataItem {
    id: UUID
    name: PersonName
    username: string
    password: string
    shift: any;
    time_created: ISODate
    time_updated: ISODate
    reference: AccountReference
    branches: any[]       // kosong di sample; ganti dengan tipe pasti kalau sudah ada skemanya
    roles: Role[]
}

// Tipe untuk keseluruhan `data`
export type AccountData = AccountDataItem[]
