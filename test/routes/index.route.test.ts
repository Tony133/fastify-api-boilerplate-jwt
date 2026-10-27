import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { build } from '../helper';

describe('Root and Secure Routes', () => {
  let app: any;

  before(async (t: any) => {
    app = await build(t);
  });

  after(async () => {
    if (app) await app.close();
  });

  test('GET api/ - should return the welcome message', async (t) => {    
    const response = await app.inject({
      method: 'GET',
      url: '/api/'
    });

    const payload = JSON.parse(response.payload);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(
      payload.message,
      'This is a simple example of item returned by your APIs'
    );
  });

  test('GET api/secure - should return 401 if no token is provided', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'GET',
      url: '/api/secure'
    });

    assert.strictEqual(response.statusCode, 401);
  });

  test('GET api/secure - should grant access when a valid token is provided', async (t) => {
    const app = await build(t);

    const token = app.jwt.sign({
      sub: 'user-id-123',
      email: 'test@example.com',
      role: 'USER'
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/secure',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    const payload = JSON.parse(response.payload);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(
      payload.message,
      'Access to protected resource granted! This protected resource is displayed when the token is successfully provided.'
    );
  });

  test('GET api/secure - should return 401 for an invalid or expired token', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'GET',
      url: '/api/secure',
      headers: {
        authorization: 'Bearer invalid-token-string'
      }
    });

    assert.strictEqual(response.statusCode, 401);
  });
});
