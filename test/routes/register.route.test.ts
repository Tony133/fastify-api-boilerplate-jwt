import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { build } from '../helper';

describe('Register Routes', async () => {
  let app: any;

  before(async (t: any) => {
    app = await build(t);
  });

  after(async () => {
    if (app) await app.close();
  });

  test('should successfully register a new user', async (t) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        firstName: 'Mario',
        lastName: 'Rossi',
        email: 'mario.rossi@example.com',
        password: 'Password123!'
      }
    });

    const payload = JSON.parse(response.payload);

    assert.strictEqual(response.statusCode, 201);
    assert.strictEqual(payload.email, 'mario.rossi@example.com');
    assert.ok(payload.id, 'User ID should be generated');
  });

  test('should return 400 for invalid email format', async (t) => {
    const app = await build(t);

    const response = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        firstName: 'Mario',
        email: 'invalid-email',
        password: 'short'
      }
    });

    assert.strictEqual(response.statusCode, 400);
  });

  test('should return 400 when the email is already registered', async (t) => {
    const app = await build(t);
    const payload = {
      firstName: 'Dup',
      lastName: 'User',
      email: 'duplicate@example.com',
      password: 'password123'
    };

    const first = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload
    });
    const second = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload
    });

    assert.strictEqual(first.statusCode, 201);
    assert.strictEqual(second.statusCode, 400);
    assert.strictEqual(
      JSON.parse(second.payload).message,
      'Registration failed'
    );
  });

  test('should ignore role and dates supplied by the client', async (t) => {
    const app = await build(t);
    const today = new Date().toISOString().split('T')[0];

    const response = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        firstName: 'Sneaky',
        lastName: 'Client',
        email: 'sneaky@example.com',
        password: 'password123',
        roles: ['ADMIN'],
        dateOfRegistration: '2000-01-01',
        dateOfLastAccess: '2000-01-01'
      }
    });

    assert.strictEqual(response.statusCode, 201);
    const user = JSON.parse(response.payload);
    assert.deepStrictEqual(user.roles, ['USER'], 'role is always USER');
    assert.strictEqual(
      user.dateOfRegistration,
      today,
      'registration date is set by the server'
    );
    assert.strictEqual(
      user.dateOfLastAccess,
      null,
      'no access before the first login'
    );
  });
});
