import { Connector } from "../../database/connector";
import { randomUUID } from "crypto";

type KV = Record<string, string | null | undefined>;

export class ConfigRepository {
    private _Connector: Connector;
    private readonly table = "config";
    private initPromise?: Promise<void>; // <- guard biar schema dibuat sekali

    constructor() {
        this._Connector = new Connector({
            name: "configs.db",
            key: "@Thedarkangels2010",
        });
    }

    get Connector(): Connector {
        return this._Connector;
    }

    async close() {
        await this._Connector.close();
    }

    // --- penting: pastikan schema ada sebelum operasi apa pun ---
    private ensureSchema(): Promise<void> {
        if (!this.initPromise) {
            const db = this._Connector.get();
            this.initPromise = db.schema
                .createTable(this.table)
                .ifNotExists()
                .addColumn("id", "text", (c) => c.primaryKey())
                .addColumn("key", "text", (c) => c.notNull().unique())
                .addColumn("value", "text")
                .execute()
                .then(() => void 0);
        }
        return this.initPromise;
    }

    // opsional: init + seed defaults (tidak override)
    async init(defaults?: KV) {
        await this.ensureSchema();
        if (defaults && Object.keys(defaults).length) {
            await this.seedDefaults(defaults);
        }
    }

    async seedDefaults(defaults: KV) {
        await this.ensureSchema();
        const db = this._Connector.get();
        for (const [key, value] of Object.entries(defaults)) {
            await db
                .insertInto(this.table)
                .values({ id: randomUUID(), key, value: value ?? null })
                // kalau default sudah ada, jangan update (biar nggak nge-override preferensi user)
                .onConflict((oc) => oc.column("key").doNothing())
                .execute();
        }
    }

    async setDefault(key: string, value: string) {
        await this.ensureSchema();
        const db = this._Connector.get();
        await db
            .insertInto(this.table)
            .values({ id: randomUUID(), key, value })
            .onConflict((oc) => oc.column("key").doNothing())
            .execute();
    }

    async all() {
        await this.ensureSchema();
        return this._Connector.get().selectFrom(this.table).selectAll().execute();
    }

    async findByKey(key: string) {
        await this.ensureSchema();
        return this._Connector.get()
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
        await this.ensureSchema();
        const db = this._Connector.get();
        await db
            .insertInto(this.table)
            .values({ id: randomUUID(), key, value: value ?? null })
            .onConflict((oc) => oc.column("key").doUpdateSet({ value: value ?? null }))
            .execute();
        return value ?? null;
    }

    async setMany(data: KV) {
        await this.ensureSchema();
        await Promise.all(Object.entries(data).map(([k, v]) => this.set(k, v ?? null)));
    }

    async removeByKey(key: string) {
        await this.ensureSchema();
        return this._Connector.get()
            .deleteFrom(this.table)
            .where("key", "=", key)
            .execute();
    }

    async removeMany(keys: string[]) {
        if (!keys.length) return;
        await this.ensureSchema();
        await this._Connector.get()
            .deleteFrom(this.table)
            .where("key", "in", keys)
            .execute();
    }
}
