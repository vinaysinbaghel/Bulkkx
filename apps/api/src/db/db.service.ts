import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  public db!: NodePgDatabase<typeof schema>;
  private pool!: Pool;

  async onModuleInit() {
    const connectionString =
      process.env.DATABASE_URL || 'postgres://bulkkx_user:bulkkx_password@localhost:5432/bulkkx_db';

    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  get client() {
    return this.db;
  }
}
