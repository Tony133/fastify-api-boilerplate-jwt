import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";

async function jwtPlugin(fastify: FastifyInstance) {
  const { config } = fastify;

  if (!config.SECRET_KEY_JWT) {
    fastify.log.error('SECRET_KEY_JWT is required');
    throw new Error('SECRET_KEY_JWT is required');
  }

  await fastify.register(fastifyJwt, {
    secret: config.SECRET_KEY_JWT
  });
}

export default fp(jwtPlugin, {
  name: 'fastify-jwt',
  dependencies: ['config']
});
