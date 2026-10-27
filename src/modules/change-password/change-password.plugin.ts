import { FastifyInstance } from 'fastify';
import { ChangePasswordService } from './change-password.service';
import changePasswordRoutes from './change-password.routes';

export default async function changePasswordPlugin(fastify: FastifyInstance) {
  const { database, hashingService } = fastify;

  const changePasswordService = new ChangePasswordService(
    database,
    hashingService
  );

  fastify.decorate('changePasswordService', changePasswordService);

  await fastify.register(changePasswordRoutes);
}
