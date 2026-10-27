import { test, describe } from 'node:test';
import assert from 'node:assert';
import { build } from '../helper';

describe('Swagger documentation (basic auth)', () => {
  const credentials = (user: string, pass: string) =>
    'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

  test('should require credentials', async (t) => {
    const app = await build(t);

    const res = await app.inject({ method: 'GET', url: '/docs' });

    assert.strictEqual(res.statusCode, 401);
  });

  test('should reject wrong credentials', async (t) => {
    const app = await build(t);

    const res = await app.inject({
      method: 'GET',
      url: '/docs',
      headers: { authorization: credentials('wrong', 'wrong') }
    });

    assert.strictEqual(res.statusCode, 401);
  });

  test('should serve the documentation with the configured credentials', async (t) => {
    const app = await build(t);

    const res = await app.inject({
      method: 'GET',
      url: '/docs',
      headers: { authorization: credentials(app.config.SWAGGER_USER, app.config.SWAGGER_PASSWORD) }
    });

    assert.ok([200, 302].includes(res.statusCode), `unexpected status ${res.statusCode}`);
  });
});
