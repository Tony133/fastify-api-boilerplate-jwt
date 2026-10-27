import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { build } from '../helper';

describe('Forgot Password Routes', () => {
  let app: any;

  before(async (t: any) => {
    app = await build(t);

    await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        firstName: 'Forgot',
        lastName: 'User',
        email: 'forgot@example.com',
        password: 'OldPassword123!'
      }
    });
  });

  after(async () => {
    if (app) await app.close();
  });

  test('POST /api/forgot-password - should reset password and return success', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/forgot-password',
      payload: { email: 'forgot@example.com' }
    });

    assert.strictEqual(response.statusCode, 200);
    const payload = JSON.parse(response.payload);
    assert.strictEqual(payload.success, true);
  });

  test('POST /api/forgot-password - should return 200 (generic answer) for non-existent email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/forgot-password',
      payload: { email: 'notfound@example.com' }
    });

    // Unknown emails are indistinguishable from known ones (no user enumeration)
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(JSON.parse(response.payload).success, true);
  });
});
