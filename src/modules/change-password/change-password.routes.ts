import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  ChangePasswordBody,
  changePasswordSchema
} from './change-password.schemas';
import { FastifyInstance } from 'fastify';

const changePasswordRoutes: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.post<{ Body: ChangePasswordBody }>(
    '/',
    {
      schema: changePasswordSchema,
      preHandler: [fastify.checkToken]
    },
    async function (request, reply) {
      const userId = request.user.sub;
      return await fastify.changePasswordService.changePassword(userId, request.body);
    }
  );
};

export default changePasswordRoutes;
