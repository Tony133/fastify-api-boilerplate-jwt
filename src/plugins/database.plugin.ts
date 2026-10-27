import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Database } from '../modules/users/users.model';
import pg from 'pg';

async function databasePlugin(fastify: FastifyInstance) {
  const { config } = fastify;

  // The application knows a single set of DB_* variables: each environment
  // (development, test, CI, production) supplies its own values, the code
  // never picks between alternatives based on the environment name.
  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      max: config.DB_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    })
  });

  const db = new Kysely<Database>({ dialect });

  try {
    await sql`SELECT 1`.execute(db);
    fastify.log.debug('Database connection health check passed');

    fastify.decorate('database', db);

    fastify.addHook('onClose', async () => {
      await db.destroy();
      fastify.log.info('Kysely Database connection pool closed');
    });
  } catch (error) {
    fastify.log.error('Database connection failed during startup');
    throw error;
  }
}

export default fp(databasePlugin, {
  name: 'database',
  dependencies: ['config']
});
