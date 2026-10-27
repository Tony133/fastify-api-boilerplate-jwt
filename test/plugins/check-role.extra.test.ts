import { test, describe } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import checkRolePlugin from '../../src/plugins/authorization/check-role.plugin';

describe('Plugin: checkRole - role claim shapes', () => {
  const appWithRole = async (role: unknown) => {
    const app = Fastify();
    await app.register(checkRolePlugin);
    app.addHook('onRequest', async (request) => { (request as any).user = { role }; });
    app.get('/admin', { preHandler: [app.checkRole('ADMIN')] }, async () => ({ ok: true }));
    await app.ready();
    return app;
  };

  test('should accept the role anywhere in an array of roles', async (t) => {
    const app = await appWithRole(['USER', 'ADMIN']);
    t.after(() => app.close());

    assert.strictEqual((await app.inject({ method: 'GET', url: '/admin' })).statusCode, 200);
  });

  test('should return 400 when the role claim is an array of non-strings', async (t) => {
    const app = await appWithRole([42]);
    t.after(() => app.close());

    assert.strictEqual((await app.inject({ method: 'GET', url: '/admin' })).statusCode, 400);
  });

  test('should return 400 when the role claim has an unexpected type', async (t) => {
    const app = await appWithRole({ name: 'ADMIN' });
    t.after(() => app.close());

    assert.strictEqual((await app.inject({ method: 'GET', url: '/admin' })).statusCode, 400);
  });
});
