import { test, describe, after, before } from 'node:test';
import assert from 'node:assert';
import { build } from '../helper';

describe('Change Password Routes', () => {
  let app: any;
  let token: string;

  before(async (t: any) => {
    app = await build(t);

    const email = 'change@example.com';
    const password = 'Password123!';

    const regRes = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        firstName: 'Change',
        lastName: 'User',
        email,
        password
      }
    });
    const user = JSON.parse(regRes.payload);

    token = app.jwt.sign({ sub: user.id, email: user.email });
  });

  after(async () => {
    if (app) await app.close();
  });

  test('POST /api/change-password - should successfully change password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/change-password',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        oldPassword: 'Password123!',
        newPassword: 'NewSecurePassword456!'
      }
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(JSON.parse(response.payload).success, true);
  });

  test('POST /api/change-password - should fail with wrong old password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/change-password',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        oldPassword: 'WrongPassword!',
        newPassword: 'SomeNewPassword123!'
      }
    });

    assert.strictEqual(response.statusCode, 400);
  });
});
