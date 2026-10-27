import { describe, it } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import checkRolePlugin from '../../src/plugins/authorization/check-role.plugin';

describe('Plugin: checkRole', () => {
  const createMockApp = async () => {
    const app = Fastify();
    await app.register(fastifyJwt, { secret: 'test-secret' });
    await app.register(checkRolePlugin);
    return app;
  };

  it('should allow access if user has the required role', async () => {
    const app = await createMockApp();
    app.get(
      '/admin',
      {
        preHandler: [
          async (req) => {
            req.user = {
              sub: '1',
              name: 'Test Admin',
              email: 'admin@example.com',
              role: ['ADMIN']
            };
          },
          (app as any).checkRole('ADMIN')
        ]
      },
      async () => ({ ok: true })
    );

    const res = await app.inject({ method: 'GET', url: '/admin' });
    assert.strictEqual(res.statusCode, 200);
  });

  it('should return 403 if user has the wrong role', async () => {
    const app = await createMockApp();
    app.get(
      '/admin-only',
      {
        preHandler: [
          async (req) => {
            req.user = {
              sub: '2',
              name: 'Test User',
              email: 'user@example.com',
              role: 'USER'
            };
          },
          (app as any).checkRole('ADMIN')
        ]
      },
      async () => ({ ok: true })
    );

    const res = await app.inject({ method: 'GET', url: '/admin-only' });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(
      JSON.parse(res.body).message,
      'Insufficient permissions'
    );
  });

  it('should return 400 if user info is missing', async () => {
    const app = await createMockApp();
    app.get(
      '/no-user',
      { preHandler: [(app as any).checkRole('ADMIN')] },
      async () => ({})
    );

    const res = await app.inject({ method: 'GET', url: '/no-user' });
    assert.strictEqual(res.statusCode, 400);
  });
});
