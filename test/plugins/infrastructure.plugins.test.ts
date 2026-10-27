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
 * `config` decorator, so the failure paths and the production/test
 * configuration branches can be exercised in isolation.
 */
function appWithConfig(config: Partial<Config>) {
  const app = Fastify({ logger: false });
  app.register(fp(async (f) => { f.decorate('config', config as Config); }, { name: 'config' }));
  return app;
}

const env = process.env;
const realDb = {
  host: env.DB_TEST_HOST || 'localhost',
  port: Number(env.DB_TEST_PORT || 5432),
  user: env.DB_TEST_USER || 'test_user',
  password: env.DB_TEST_PASSWORD || 'test_password',
  database: env.DB_TEST_NAME || 'test_db'
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

  test('production: should use DB_* and ignore DB_TEST_* overrides', async (t) => {
    const app = appWithConfig(asConfig({
      NODE_ENV: 'production',
      // Deliberately broken test settings: they must be ignored in production
      DB_TEST_HOST: '127.0.0.1', DB_TEST_PORT: 1, DB_TEST_USER: 'nobody',
      DB_TEST_PASSWORD: 'x', DB_TEST_NAME: 'nope', DB_TEST_POOL_MAX: 1
    }));
    app.register(databasePlugin);
    await app.ready();
    t.after(() => app.close());

    assert.ok(app.database instanceof Kysely);
  });

  test('test env: should prefer DB_TEST_* when set', async (t) => {
    const app = appWithConfig(asConfig({
      NODE_ENV: 'test',
      // Deliberately broken main settings: the test ones must win
      DB_HOST: '127.0.0.1', DB_PORT: 1, DB_USER: 'nobody', DB_PASSWORD: 'x', DB_NAME: 'nope',
      DB_TEST_HOST: realDb.host, DB_TEST_PORT: realDb.port, DB_TEST_USER: realDb.user,
      DB_TEST_PASSWORD: realDb.password, DB_TEST_NAME: realDb.database, DB_TEST_POOL_MAX: 2
    }));
    app.register(databasePlugin);
    await app.ready();
    t.after(() => app.close());

    assert.ok(app.database instanceof Kysely);
  });

  test('test env: should fall back to DB_* when DB_TEST_* are not set', async (t) => {
    const app = appWithConfig(asConfig({ NODE_ENV: 'test' }));
    app.register(databasePlugin);
    await app.ready();
    t.after(() => app.close());

    assert.ok(app.database instanceof Kysely);
  });

  test('should refuse to start when the database is unreachable', async () => {
    const app = appWithConfig(asConfig({ NODE_ENV: 'production', DB_HOST: '127.0.0.1', DB_PORT: 1 }));
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

  const testOverrides: Partial<Config> = {
    EMAIL_TEST_HOST: 'smtp.test.example', EMAIL_TEST_PORT: 2525, EMAIL_TEST_SECURE: false,
    EMAIL_TEST_AUTH_USER: 'test', EMAIL_TEST_AUTH_PASSWORD: 'test-pass',
    EMAIL_TEST_FROM_NAME: 'Test', EMAIL_TEST_FROM_EMAIL: 'test@example.com',
    EMAIL_TEST_DEBUG: true, EMAIL_TEST_LOGGER: true
  };

  test('production: should use EMAIL_* and ignore EMAIL_TEST_*', async (t) => {
    const app = appWithConfig(asConfig({ NODE_ENV: 'production', ...testOverrides }));
    app.register(mailerPlugin);
    await app.ready();
    t.after(() => app.close());

    assert.ok(app.mailerService instanceof MailerService);
    const opts = transporterOptions(app);
    assert.strictEqual(opts.host, 'smtp.prod.example');
    assert.strictEqual(opts.port, 465);
    assert.strictEqual(opts.secure, true);
  });

  test('test env: should prefer EMAIL_TEST_* when set', async (t) => {
    const app = appWithConfig(asConfig({ NODE_ENV: 'test', ...testOverrides }));
    app.register(mailerPlugin);
    await app.ready();
    t.after(() => app.close());

    const opts = transporterOptions(app);
    assert.strictEqual(opts.host, 'smtp.test.example');
    assert.strictEqual(opts.port, 2525);
    assert.strictEqual(opts.secure, false);
    assert.strictEqual(opts.debug, true);
  });

  test('test env: should fall back to EMAIL_* when EMAIL_TEST_* are not set', async (t) => {
    const app = appWithConfig(asConfig({ NODE_ENV: 'test' }));
    app.register(mailerPlugin);
    await app.ready();
    t.after(() => app.close());

    assert.strictEqual(transporterOptions(app).host, 'smtp.prod.example');
  });

  test('should keep an already injected mailerService (test mock)', async (t) => {
    const app = appWithConfig(asConfig({ NODE_ENV: 'test' }));
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
