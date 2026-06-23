import fp from 'fastify-plugin';
import envSchema from 'env-schema';
import { Type, type Static } from 'typebox';
import { FastifyInstance } from 'fastify';

export const EnvSchema = Type.Object({
  LOG_LEVEL: Type.Union(
    [
      Type.Literal('fatal'),
      Type.Literal('error'),
      Type.Literal('warn'),
      Type.Literal('info'),
      Type.Literal('debug'),
      Type.Literal('trace')
    ],
    { default: 'info' }
  ),

  SECRET_KEY_JWT: Type.String(),

  // Database
  DB_HOST: Type.String({ default: 'localhost' }),
  DB_PORT: Type.Number({ default: 5432 }),
  DB_USER: Type.String({ default: 'postgres' }),
  DB_PASSWORD: Type.String(),
  DB_NAME: Type.String({ default: 'app_backend' }),
  DB_NAME_TEST: Type.String({ default: 'app_backend' }),
  DB_POOL_MAX: Type.Number({ default: 10 }),

  // Database - Test
  DB_TEST_HOST: Type.Optional(Type.String()),
  DB_TEST_PORT: Type.Optional(Type.Number()),
  DB_TEST_USER: Type.Optional(Type.String()),
  DB_TEST_PASSWORD: Type.Optional(Type.String()),
  DB_TEST_NAME: Type.Optional(Type.String()),
  DB_TEST_POOL_MAX: Type.Optional(Type.Number()),

  // Email
  EMAIL_HOST: Type.String(),
  EMAIL_PORT: Type.Number(),
  EMAIL_SECURE: Type.Boolean({ default: false }),
  EMAIL_AUTH_USER: Type.String(),
  EMAIL_AUTH_PASSWORD: Type.String(),
  EMAIL_FROM_NAME: Type.String(),
  EMAIL_FROM_EMAIL: Type.String(),
  EMAIL_DEBUG: Type.Boolean({ default: false }),
  EMAIL_LOGGER: Type.Boolean({ default: false }),

  // Email - Test
  EMAIL_TEST_HOST: Type.Optional(Type.String()),
  EMAIL_TEST_PORT: Type.Optional(Type.Number()),
  EMAIL_TEST_SECURE: Type.Optional(Type.Boolean()),
  EMAIL_TEST_AUTH_USER: Type.Optional(Type.String()),
  EMAIL_TEST_AUTH_PASSWORD: Type.Optional(Type.String()),
  EMAIL_TEST_FROM_NAME: Type.Optional(Type.String()),
  EMAIL_TEST_FROM_EMAIL: Type.Optional(Type.String()),
  EMAIL_TEST_DEBUG: Type.Optional(Type.Boolean()),
  EMAIL_TEST_LOGGER: Type.Optional(Type.Boolean()),

  // Swagger & Fastify
  SWAGGER_USER: Type.String(),
  SWAGGER_PASSWORD: Type.String(),
  FASTIFY_PORT: Type.Number({ default: 3000 }),
  FASTIFY_CLOSE_GRACE_DELAY: Type.Number({ default: 500 }),
  FASTIFY_ADDRESS: Type.String({ default: '127.0.0.1' }),
});

export type Config = Static<typeof EnvSchema>;


async function configPlugin(fastify: FastifyInstance) {
  const config = envSchema<Config>({
    schema: EnvSchema,
    dotenv: true
  });

  fastify.decorate('config', config);
}
  
export default fp(configPlugin,{
  name: 'config'
});
