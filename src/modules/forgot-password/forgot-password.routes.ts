import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { ForgotPasswordBody, forgotPasswordSchema } from './forgot-password.schemas';
import { FastifyInstance } from 'fastify';

const forgotPasswordRoutes: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.post<{ Body: ForgotPasswordBody }>(
    '/',
    {
      schema: forgotPasswordSchema,
      // Each call sends an email and rotates a password: keep it tight
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
    },
    async function (request, reply) {
      return await fastify.forgotPasswordService.forgotPassword(request.body);
    }
  );
};

export default forgotPasswordRoutes;