import { FastifyInstance } from 'fastify';
import { ForgotPasswordService } from './forgot-password.service';
import forgotPasswordRoutes from './forgot-password.routes';

export default async function forgotPasswordPlugin(fastify: FastifyInstance) {
  const { database, hashingService, mailerService } = fastify;

  const forgotPasswordService = new ForgotPasswordService(
    database,
    hashingService,
    mailerService,
    fastify.log
  );

  fastify.decorate('forgotPasswordService', forgotPasswordService);

  await fastify.register(forgotPasswordRoutes);
}
