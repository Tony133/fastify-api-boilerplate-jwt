import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildLoggerOptions } from '../src/app';
import { build } from './helper';

describe('buildLoggerOptions', () => {
  test('should default to info and upper-case the level label', () => {
    const opts = buildLoggerOptions(undefined);

    assert.strictEqual(opts.level, 'info');
    assert.strictEqual(opts.transport, undefined);
    assert.deepStrictEqual(opts.formatters.level('warn'), { level: 'WARN' });
  });

  test('should enable pino-pretty only at debug level', () => {
    assert.strictEqual(buildLoggerOptions('debug').transport?.target, 'pino-pretty');
    assert.strictEqual(buildLoggerOptions('error').transport, undefined);
    assert.strictEqual(buildLoggerOptions('error').level, 'error');
  });
});

describe('global error handler', () => {
  // Routes that fail in different ways, registered on top of the real app
  const failingRoutes = (app: any) => {
    app.get('/boom', async () => { throw new Error('something broke'); });
    app.get('/teapot', async () => {
      throw Object.assign(new Error('short and stout'), { statusCode: 418, code: 'FST_TEAPOT' });
    });
  };

  test('should expose the message of unexpected errors outside production', async (t) => {
    const app = await build(t, failingRoutes);

    const res = await app.inject({ method: 'GET', url: '/boom' });

    assert.strictEqual(res.statusCode, 500);
    assert.deepStrictEqual(JSON.parse(res.payload), {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'something broke'
    });
  });

  test('should hide the message of unexpected errors in production', async (t) => {
    const app = await build(t, failingRoutes);
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    t.after(() => {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    });
    
    const res = await app.inject({ method: 'GET', url: '/boom' });

    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(JSON.parse(res.payload).message, 'Internal Server Error');
  });

  test('should keep status code and error code of typed errors', async (t) => {
    const app = await build(t, failingRoutes);

    const res = await app.inject({ method: 'GET', url: '/teapot' });

    assert.strictEqual(res.statusCode, 418);
    assert.deepStrictEqual(JSON.parse(res.payload), {
      statusCode: 418,
      error: 'FST_TEAPOT',
      message: 'short and stout'
    });
  });

  test('should include validation details for schema errors', async (t) => {
    const app = await build(t);

    const res = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: { email: 'not-an-email', password: '123456' }
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.error, 'FST_ERR_VALIDATION');
    assert.ok(Array.isArray(body.details));
  });
});
