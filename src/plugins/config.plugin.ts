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

  // Include the message of unexpected (5xx) errors in HTTP responses.
  // Off by default: enable it only for local development.
  EXPOSE_ERROR_DETAILS: Type.Boolean({ default: false }),

  SECRET_KEY_JWT: Type.String({ minLength: 1 }),
  // Accepts the formats of @fastify/jwt `expiresIn` (e.g. '15m', '2h', '7d')
  JWT_ACCESS_TOKEN_EXPIRES_IN: Type.String({ default: '2h' }),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Type.String({ default: '7d' }),

  // Database
  DB_HOST: Type.String({ default: 'localhost' }),
  DB_PORT: Type.Number({ default: 5432 }),
  DB_USER: Type.String({ default: 'postgres' }),
  DB_PASSWORD: Type.String(),
  DB_NAME: Type.String({ default: 'app_backend' }),
  DB_POOL_MAX: Type.Number({ default: 10 }),

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

  // Swagger & Fastify
  SWAGGER_USER: Type.String(),
  SWAGGER_PASSWORD: Type.String(),
  FASTIFY_PORT: Type.Number({ default: 3000 }),
  FASTIFY_CLOSE_GRACE_DELAY: Type.Number({ default: 500 }),
  FASTIFY_ADDRESS: Type.String({ default: '127.0.0.1' }),
});

export type Config = Static<typeof EnvSchema>;


async function configPlugin(fastify: FastifyInstance) {
  // Configuration comes from the process environment only. The .env file is
  // loaded by the entrypoint (server.ts) or by `--env-file`, never from here,
  // so tests and other environments can never pick up values from a stray .env.
  const config = envSchema<Config>({
    schema: EnvSchema,
    dotenv: false
  });

  fastify.decorate('config', config);
}
  
export default fp(configPlugin,{
  name: 'config'
});
