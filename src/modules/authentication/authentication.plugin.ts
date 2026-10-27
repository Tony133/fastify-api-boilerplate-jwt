import { FastifyInstance } from 'fastify';
import { AuthenticationService } from './authentication.service';
import authenticationRoutes from './authentication.routes';

export default async function authenticationPlugin(fastify: FastifyInstance) {
  const { database, hashingService } = fastify;

  const authenticationService = new AuthenticationService(
    database,
    hashingService
  );

  fastify.decorate('authenticationService', authenticationService);

  await fastify.register(authenticationRoutes);
}
