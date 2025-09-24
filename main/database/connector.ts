import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3-multiple-ciphers'
import path from "path";
import {getExternalDatabaseDir} from "../functions";

export interface ConnectorConfig{
    key : string,
    name : string;
    dir?: string,
}

export class Connector {

    private readonly db?: Kysely<any>
    private readonly sqlite?: Database.Database

    constructor(config: ConnectorConfig) {
        const configDir = config.dir ?? getExternalDatabaseDir();
        const dbFile = path.join(configDir, config.name);
        this.sqlite = new Database(dbFile);
        // pilih engine kalau perlu
        this.sqlite.pragma(`cipher='sqlcipher'`);
        this.sqlite.pragma(`legacy=4`)
        // apply key sebelum apapun
        this.sqlite.pragma(`key='${config.key}'`);
        this.sqlite.pragma('journal_mode = WAL');
        this.db = new Kysely({
            dialect: new SqliteDialect({ database: this.sqlite })
        });
    }

    get() {
        if (!this.db) throw new Error('Database belum dibuka. Panggil open() dulu.')
        return this.db
    }

    async close() {
        this.sqlite.close() // close driver
        await this.db.destroy() // release connection Kysely
    }
}