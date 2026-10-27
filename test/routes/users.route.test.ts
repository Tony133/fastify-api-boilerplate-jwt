import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { build, TestContext } from '../helper';

describe('Users Routes', () => {
  let app: any;

  before(async (t: any) => {
    app = await build(t);
  });

  after(async () => {
    if (app) await app.close();
  });

  test('POST / - should create a new user when authenticated', async (t: TestContext) => {

    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!'
      }
    });

    assert.strictEqual(response.statusCode, 201);
    const payload = JSON.parse(response.payload);
    assert.strictEqual(payload.email, 'john.doe@example.com');
  });

  test('GET / - should return a list of all users', async (t: TestContext) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 200);
    const payload = JSON.parse(response.payload);
    assert.ok(Array.isArray(payload), 'Response should be an array of users');
  });

  test('GET /:id - should return 404 for a non-existent user ID', async (t: TestContext) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/00000000-0000-0000-0000-000000000000', // Non-existent UUID
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 404);
    const payload = JSON.parse(response.payload);
    assert.strictEqual(payload.error, 'Bad Request');
  });


  test('PUT /:id - should successfully update user data', async (t: TestContext) => {
    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/users/',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Original Name',
        lastName: 'User',
        email: 'update.test@example.com',
        password: 'Password123!'
      }
    });

    const createdUser = JSON.parse(createResponse.payload);
    const userId = createdUser.id;

    const data = { firstName: 'John Updated' };
    const response = await app.inject({
      method: 'PUT',
      url: `/api/users/${userId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        firstName: data.firstName
      }
    });

    assert.strictEqual(response.statusCode, 200, 'Should return 200 OK');
    
    const updatedUser = JSON.parse(response.payload);
    assert.strictEqual(updatedUser.firstName, data.firstName, 'The name should be updated in the response');
    assert.strictEqual(updatedUser.id, userId, 'The ID should remain the same');
  });

  test('DELETE /:id - should return 204 No Content on successful deletion', async (t: TestContext) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/users/',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'delete-me@example.com',
        password: 'Password123!'
      }
    });

    const createdUser = JSON.parse(createRes.payload);
    const userId = createdUser.id;

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/users/${userId}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 204);
  });

  test('Access Denied - should return 401 Unauthorized when token is missing', async (t: TestContext) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/'
    });

    assert.strictEqual(response.statusCode, 401);
  });

  test('GET /:id - should return the user when it exists', async (t: TestContext) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/users/',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Find',
        lastName: 'Myself',
        email: 'find.me@example.com',
        password: 'Password123!'
      }
    });
    const created = JSON.parse(createRes.payload);

    const response = await app.inject({
      method: 'GET',
      url: `/api/users/${created.id}`,
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 200);
    const user = JSON.parse(response.payload);
    assert.strictEqual(user.id, created.id);
    assert.strictEqual(user.email, 'find.me@example.com');
    assert.strictEqual(user.password, undefined, 'password hash must never be returned');
  });

  test('should return 403 for an authenticated user without the ADMIN role', async (t: TestContext) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: 'user-id', role: ['USER'] });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 403);
  });

  test('GET /:id - should return 400 (not a database error) for a malformed id', async (t: TestContext) => {
    const app = await build(t);
    const token = app.jwt.sign({ sub: 'admin-id', role: 'ADMIN' });

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/not-a-uuid',
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(JSON.parse(response.payload).error, 'FST_ERR_VALIDATION');
  });
});
