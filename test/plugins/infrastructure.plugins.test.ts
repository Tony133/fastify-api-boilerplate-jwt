import { test, describe } from 'node:test';
import assert from 'node:assert';
import Fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import jwtPlugin from '../../src/plugins/jwt.plugin';
import databasePlugin from '../../src/plugins/database.plugin';
import mailerPlugin from '../../src/plugins/mailer.plugin';
import { databaseHealthCheck } from '../../src/plugins/under-pressure.plugin';
import { MailerService } from '../../src/shared/mailer/mailer.service';
import { Config } from '../../src/plugins/config.plugin';

/**
 * These plugins are normally loaded through autoload with the real config.
 * Here each one is registered on a bare Fastify instance with a hand-made
 * `config` decorator, so the failure paths can be exercised in isolation.
 */
function appWithConfig(config: Partial<Config>) {
  const app = Fastify({ logger: false });
  app.register(fp(async (f) => { f.decorate('config', config as Config); }, { name: 'config' }));
  return app;
}

const env = process.env;
// Same database the rest of the suite uses (from .env.test or the CI environment)
const realDb = {
  host: env.DB_HOST || 'localhost',
  port: Number(env.DB_PORT || 5433),
  user: env.DB_USER || 'test_user',
  password: env.DB_PASSWORD || 'test_password',
  database: env.DB_NAME || 'test_db'
};

describe('jwt plugin', () => {
  test('should refuse to start when SECRET_KEY_JWT is empty', async () => {
    const app = appWithConfig({ SECRET_KEY_JWT: '' });
    app.register(jwtPlugin);

    await assert.rejects(async () => { await app.ready(); }, /SECRET_KEY_JWT is required/);
  });

  test('should register @fastify/jwt with the configured secret', async (t) => {
    const app = appWithConfig({ SECRET_KEY_JWT: 'a-secret' });
    app.register(jwtPlugin);
    await app.ready();
    t.after(() => app.close());

    const token = app.jwt.sign({ sub: '1' });
    assert.strictEqual((app.jwt.verify(token) as { sub: string }).sub, '1');
  });
});

describe('database plugin', () => {
  const asConfig = (overrides: Partial<Config>): Partial<Config> => ({
    DB_HOST: realDb.host, DB_PORT: realDb.port, DB_USER: realDb.user,
    DB_PASSWORD: realDb.password, DB_NAME: realDb.database, DB_POOL_MAX: 2,
    ...overrides
  });

  test('should connect, decorate `database` and close the pool on shutdown', async () => {
    const app = appWithConfig(asConfig({}));
    app.register(databasePlugin);
    await app.ready();

    assert.ok(app.database instanceof Kysely);
    await app.close();
  });

  test('should refuse to start when the database is unreachable', async () => {
    const app = appWithConfig(asConfig({ DB_HOST: '127.0.0.1', DB_PORT: 1 }));
    app.register(databasePlugin);

    await assert.rejects(async () => { await app.ready(); });
  });
});

describe('mailer plugin', () => {
  const transporterOptions = (app: FastifyInstance) =>
    (app.mailerService as unknown as { transporter: { options: Record<string, unknown> } }).transporter.options;

  const asConfig = (overrides: Partial<Config>): Partial<Config> => ({
    EMAIL_HOST: 'smtp.prod.example', EMAIL_PORT: 465, EMAIL_SECURE: true,
    EMAIL_AUTH_USER: 'prod', EMAIL_AUTH_PASSWORD: 'prod-pass',
    EMAIL_FROM_NAME: 'Prod', EMAIL_FROM_EMAIL: 'prod@example.com',
    EMAIL_DEBUG: false, EMAIL_LOGGER: false,
    ...overrides
  });

  test('should build the real MailerService from EMAIL_*', async (t) => {
    const app = appWithConfig(asConfig({}));
    app.register(mailerPlugin);
    await app.ready();
    t.after(() => app.close());

    assert.ok(app.mailerService instanceof MailerService);
    const opts = transporterOptions(app);
    assert.strictEqual(opts.host, 'smtp.prod.example');
    assert.strictEqual(opts.port, 465);
    assert.strictEqual(opts.secure, true);
  });

  test('should keep an already injected mailerService (test mock)', async (t) => {
    const app = appWithConfig(asConfig({}));
    const mock = { sendMail: async () => ({}) } as unknown as MailerService;
    app.register(fp(async (f) => { f.decorate('mailerService', mock); }));
    app.register(mailerPlugin);
    await app.ready();
    t.after(() => app.close());

    assert.strictEqual(app.mailerService, mock);
  });
});

describe('under-pressure database health check', () => {
  const fakeApp = (database: Kysely<any>) => {
    const errors: unknown[] = [];
    const app = { database, log: { error: (e: unknown) => errors.push(e) } } as unknown as FastifyInstance;
    return { app, errors };
  };

  test('should return true when the database answers', async (t) => {
    const database = new Kysely<any>({ dialect: new PostgresDialect({ pool: new pg.Pool({ ...realDb, max: 1 }) }) });
    t.after(() => database.destroy());
    const { app, errors } = fakeApp(database);

    assert.strictEqual(await databaseHealthCheck(app), true);
    assert.strictEqual(errors.length, 0);
  });

  test('should return false and log when the database is unreachable', async (t) => {
    const database = new Kysely<any>({
      dialect: new PostgresDialect({ pool: new pg.Pool({ ...realDb, host: '127.0.0.1', port: 1, max: 1, connectionTimeoutMillis: 500 }) })
    });
    t.after(() => database.destroy());
    const { app, errors } = fakeApp(database);

    assert.strictEqual(await databaseHealthCheck(app), false);
    assert.strictEqual(errors.length, 1);
  });
});
