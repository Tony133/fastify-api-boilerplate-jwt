import { describe, it } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import checkTokenPlugin from '../../src/plugins/authorization/check-token.plugin';

describe('Plugin: checkToken', () => {
  const createMockApp = async () => {
    const app = Fastify();
    await app.register(fastifyJwt, { secret: 'test-secret' });
    await app.register(checkTokenPlugin);

    app.get('/protected', { preHandler: [(app as any).checkToken] }, async () => ({
      ok: true
    }));
    return app;
  };

  it('should return 401 if token is missing', async () => {
    const app = await createMockApp();
    const res = await app.inject({ method: 'GET', url: '/protected' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('should return 200 if token is valid', async () => {
    const app = await createMockApp();
    const token = app.jwt.sign({ sub: 'user1' });

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
  });
});
