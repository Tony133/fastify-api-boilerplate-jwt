import { FastifyInstance } from 'fastify';
import { UsersService } from './users.service';
import usersRoutes from './users.routes';

export default async function usersPlugin(fastify: FastifyInstance) {
  const { database, hashingService } = fastify;

  const usersService = new UsersService(database, hashingService);

  fastify.decorate('usersService', usersService);

  await fastify.register(usersRoutes);
}
