// Alias biar rapi
type UUID = string
type ISODate = string

// Nama orang
interface PersonName {
    last_name: string
    first_name: string
}

// Referensi user sederhana (tanpa nested "reference" lagi)
interface AccountReference {
    id: UUID
    name: PersonName
    username: string
    password: string
    time_created: ISODate
    time_updated: ISODate
}

// Role/Peran user
interface Role {
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
interface AccountDataItem {
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
type AccountData = AccountDataItem[]
