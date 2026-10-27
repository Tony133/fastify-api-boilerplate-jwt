import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import { build } from '../helper';
import { AuthenticationService } from '../../src/modules/authentication/authentication.service';

describe('Authentication Routes', () => {
  let app: any;

  before(async (t: any) => {
    app = await build(t);

    await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      }
    });
  });

  after(async () => {
    if (app) await app.close();
  });

  test('should successfully login with valid credentials', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    const payload = JSON.parse(response.payload);

    assert.strictEqual(response.statusCode, 200);
    assert.ok(payload.accessToken, 'Should return a JWT access token');
    assert.strictEqual(payload.userData.success, true);
    assert.ok(payload.userData, 'Should contain userData');
  });

  test('should return 401 for invalid credentials', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: {
        email: 'test@example.com',
        password: 'wrongpasswordlong'
      }
    });

    assert.strictEqual(response.statusCode, 401);
    const payload = JSON.parse(response.payload);
    assert.strictEqual(payload.error, 'Invalid email or password');
  });

  test('should return 400 if email or password are missing', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: {
        email: 'test@example.com'
      }
    });

    assert.strictEqual(response.statusCode, 400);
  });

  test('should fail to access protected route without token', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'GET',
      url: '/api/authentication/is-authenticated'
    });

    assert.strictEqual(response.statusCode, 401);
  });

  test('should return authenticated user data when a valid token is provided', async (t) => {
    const app = await build(t);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    const { accessToken } = JSON.parse(loginRes.payload);

    const userRes = await app.inject({
      method: 'GET',
      url: '/api/authentication/user-authenticated',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    assert.strictEqual(userRes.statusCode, 200);
    const userData = JSON.parse(userRes.payload);
    assert.ok(userData.id, 'Should contain user information');
  });

  test('login response must never contain the password hash', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: { email: 'test@example.com', password: 'password123' }
    });

    assert.strictEqual(response.statusCode, 200);
    const payload = JSON.parse(response.payload);
    assert.strictEqual(payload.userData.user.password, undefined);
    assert.ok(payload.refreshToken, 'Should return a refresh token');
  });

  test('should refresh the access token when a valid refresh token is provided', async (t) => {
    const app = await build(t);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: { email: 'test@example.com', password: 'password123' }
    });
    const { refreshToken } = JSON.parse(loginRes.payload);

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/refresh-token',
      payload: { refreshToken }
    });

    const payload = JSON.parse(response.payload);
    assert.strictEqual(response.statusCode, 200);
    assert.ok(payload.accessToken, 'Should return a new access token');
    assert.ok(payload.refreshToken, 'Should return a rotated refresh token');

    // The new access token must carry `sub`, so protected routes keep working
    const userRes = await app.inject({
      method: 'GET',
      url: '/api/authentication/user-authenticated',
      headers: { authorization: `Bearer ${payload.accessToken}` }
    });
    assert.strictEqual(userRes.statusCode, 200);
    assert.strictEqual(JSON.parse(userRes.payload).email, 'test@example.com');
  });

  test('should reject an access token used as a refresh token', async (t) => {
    const app = await build(t);

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: { email: 'test@example.com', password: 'password123' }
    });
    const { accessToken } = JSON.parse(loginRes.payload);

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/refresh-token',
      payload: { refreshToken: accessToken }
    });

    assert.strictEqual(response.statusCode, 401);
  });

  test('should reject a refresh token for a user that no longer exists', async (t) => {
    const app = await build(t);
    const ghostToken = app.jwt.sign({ sub: '00000000-0000-0000-0000-000000000000', type: 'refresh' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/refresh-token',
      payload: { refreshToken: ghostToken }
    });

    assert.strictEqual(response.statusCode, 401);
  });

  test('should reject a malformed refresh token', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/refresh-token',
      payload: { refreshToken: 'not-a-jwt' }
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(JSON.parse(response.payload).message, 'Invalid refresh token');
  });

  test('should answer 500 (not 401) when the login fails for an unexpected reason', async (t) => {
    const app = await build(t);
    const login = mock.method(AuthenticationService.prototype, 'login', async () => {
      throw new Error('database down');
    });
    t.after(() => login.mock.restore());

    const response = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: { email: 'test@example.com', password: 'password123' }
    });

    assert.strictEqual(response.statusCode, 500);
    assert.notStrictEqual(JSON.parse(response.payload).error, 'Invalid email or password');
  });

  test('should return 404 from /user-authenticated when the token user no longer exists', async (t) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: '00000000-0000-0000-0000-000000000000', role: ['USER'] });

    const response = await app.inject({
      method: 'GET',
      url: '/api/authentication/user-authenticated',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 404);
  });

  test('should confirm authentication for a valid USER token', async (t) => {
    const app = await build(t);
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/authentication/login',
      payload: { email: 'test@example.com', password: 'password123' }
    });
    const { accessToken } = JSON.parse(loginRes.payload);

    const response = await app.inject({
      method: 'GET',
      url: '/api/authentication/is-authenticated',
      headers: { authorization: `Bearer ${accessToken}` }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(response.payload), { authenticated: true });
  });
});
