import { FastifyInstance } from 'fastify';
import { RegisterService } from './register.service';
import registerRoutes from './register.routes';

export default async function registerPlugin(fastify: FastifyInstance,) {
  const { database, hashingService } = fastify;

  const registerService = new RegisterService(database, hashingService);

  fastify.decorate('registerService', registerService);

  await fastify.register(registerRoutes);
}
