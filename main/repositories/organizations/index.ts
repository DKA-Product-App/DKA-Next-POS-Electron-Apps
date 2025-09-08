import { Connector } from "../../database/connector";
import { randomUUID } from "crypto";

export class OrganizationsRepository {
    private readonly DB: Connector;
    private readonly table: string = "config_organization";

    constructor() {
        this.DB = new Connector({
            name: "configurations.db",
            key: "@Cyberhack2010",
        });

        // Buat tabel kalau belum ada
        this.DB.get().schema
            .createTable(this.table)
            .ifNotExists()
            .addColumn("id", "text", (c) => c.primaryKey()) // UUID
            .addColumn("name", "text", (c) => c.notNull())
            .addColumn("address", "text")
            .addColumn("email", "text")
            .addColumn("phone", "text")
            .addColumn("status", "integer", (c) => c.notNull().defaultTo(1)) // 1=true, 0=false
            .execute();
    }

    // =======================
    // CRUD Contoh
    // =======================

    async create(data: {
        name: string;
        address?: string;
        email?: string;
        phone?: string;
        status?: boolean;
    }) {
        const db = this.DB.get();
        const id = randomUUID();

        await db
            .insertInto(this.table)
            .values({
                id,
                name: data.name,
                address: data.address ?? null,
                email: data.email ?? null,
                phone: data.phone ?? null,
                status: data.status === false ? 0 : 1,
            })
            .execute();

        return { id, ...data };
    }

    async all() {
        return this.DB.get()
            .selectFrom(this.table)
            .selectAll()
            .execute();
    }

    async findById(id: string) {
        return this.DB.get()
            .selectFrom(this.table)
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirst();
    }

    async update(id: string, data: Partial<{ name: string; address: string; email: string; phone: string; status: boolean }>) {
        return this.DB.get()
            .updateTable(this.table)
            .set({
                ...(data.name && { name: data.name }),
                ...(data.address && { address: data.address }),
                ...(data.email && { email: data.email }),
                ...(data.phone && { phone: data.phone }),
                ...(data.status !== undefined && { status: data.status ? 1 : 0 }),
            })
            .where("id", "=", id)
            .execute();
    }

    async remove(id: string) {
        return this.DB.get()
            .deleteFrom(this.table)
            .where("id", "=", id)
            .execute();
    }

    async destroy() {
        await this.DB.close();
    }
}
