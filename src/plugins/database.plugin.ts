import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Database } from '../modules/users/users.model';
import pg from 'pg';

async function databasePlugin(fastify: FastifyInstance) {
  const { config } = fastify;

  // DB_TEST_* overrides are honoured only outside production, so a stray
  // variable can never point a production deployment at the test database.
  const useTestDb = config.NODE_ENV !== 'production';

  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      host: (useTestDb && config.DB_TEST_HOST) || config.DB_HOST,
      port: (useTestDb && config.DB_TEST_PORT) || config.DB_PORT,
      user: (useTestDb && config.DB_TEST_USER) || config.DB_USER,
      password: (useTestDb && config.DB_TEST_PASSWORD) || config.DB_PASSWORD,
      database: (useTestDb && config.DB_TEST_NAME) || config.DB_NAME,
      max: (useTestDb && config.DB_TEST_POOL_MAX) || config.DB_POOL_MAX,
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
