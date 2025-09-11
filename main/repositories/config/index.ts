import { Connector } from "../../database/connector";
import { randomUUID } from "crypto";

type KV = Record<string, string | null | undefined>;

export class ConfigRepository {
    private _Connector: Connector;
    private readonly table = "config";

    constructor() {
        this._Connector = new Connector({
            name: "base_configs_local.db",
            key: "@Thedarkangels2010",
        });
    }

    get Connector(): Connector {
        return this._Connector;
    }

    /** Tutup DB (Kysely + driver) */
    async close() {
        await this.Connector.close();
    }

    async init(defaults?: KV) {
        const db = this.Connector.get();

        await db.schema
            .createTable(this.table)
            .ifNotExists()
            .addColumn("id", "text", (c) => c.primaryKey())
            .addColumn("key", "text", (c) => c.notNull().unique())
            .addColumn("value", "text")
            .execute();

        if (defaults && Object.keys(defaults).length) {
            await this.seedDefaults(defaults);
        }
    }

    async seedDefaults(defaults: KV) {
        const db = this.Connector.get();

        for (const [key, value] of Object.entries(defaults)) {
            await db
                .insertInto(this.table)
                .values({ id: randomUUID(), key, value: value ?? null })
                .onConflict((oc) =>
                    oc.column("key").doUpdateSet({ value: value ?? null })
                )
                .execute();
        }
    }

    // repositories/config.ts
    async setDefault(key: string, value: string) {
        const db = this.Connector.get()
        await db
            .insertInto(this.table)
            .values({ id: crypto.randomUUID(), key, value })
            .onConflict(oc => oc.column('key').doNothing()) // ⬅️ penting
            .execute()
    }

    async all() {
        return this.Connector.get().selectFrom(this.table).selectAll().execute();
    }

    async findByKey(key: string) {
        return this.Connector.get()
            .selectFrom(this.table)
            .selectAll()
            .where("key", "=", key)
            .executeTakeFirst();
    }

    async get(key: string): Promise<string | undefined> {
        const row = await this.findByKey(key);
        return row?.value ?? undefined;
    }

    async set(key: string, value: string | null | undefined) {
        const db = this.Connector.get();

        await db
            .insertInto(this.table)
            .values({ id: randomUUID(), key, value: value ?? null })
            .onConflict((oc) =>
                oc.column("key").doUpdateSet({ value: value ?? null })
            )
            .execute();

        return value ?? null;
    }

    async setMany(data: KV) {
        const ops = Object.entries(data).map(([k, v]) => this.set(k, v ?? null));
        await Promise.all(ops);
    }

    async removeByKey(key: string) {
        return this.Connector.get()
            .deleteFrom(this.table)
            .where("key", "=", key)
            .execute();
    }

    async removeMany(keys: string[]) {
        if (!keys.length) return;
        await this.Connector.get()
            .deleteFrom(this.table)
            .where("key", "in", keys)
            .execute();
    }
}
