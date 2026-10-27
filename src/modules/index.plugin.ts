import { FastifyInstance } from 'fastify';
import indexRoutes from './index.routes';

export default async function indexPlugin(fastify: FastifyInstance) {

  await fastify.register(indexRoutes);
}
