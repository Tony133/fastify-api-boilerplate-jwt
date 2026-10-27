import { join } from 'node:path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import {
  FastifyError,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions
} from 'fastify';

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

/** Pino options for the given level; pretty-printed only at `debug`. */
export function buildLoggerOptions(level: string | undefined) {
  return {
    level: level || 'info',
    formatters: {
      level: (label: string) => {
        return { level: label.toUpperCase() };
      }
    },
    transport:
      level === 'debug'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
              ignore: 'pid,hostname',
              colorize: true
            }
          }
        : undefined
  };
}

// Centralized configuration
export const options: AppOptions = {
  bodyLimit: 1048576 * 50,
  logger: buildLoggerOptions(process.env.LOG_LEVEL),
  ajv: {
    customOptions: {
      removeAdditional: 'all'
    }
  }
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  
  // Centralized error handling
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;
    request.log.error({ err: error });

    const response = {
      statusCode,
      error:
        error.code ??
        (statusCode >= 500 ? 'Internal Server Error' : 'Bad Request'),
      // Details of unexpected (5xx) errors are hidden unless explicitly enabled
      // (EXPOSE_ERROR_DETAILS=true, meant for local development only).
      message:
        statusCode >= 500 && !fastify.config.EXPOSE_ERROR_DETAILS
          ? 'Internal Server Error'
          : error.message,
      ...(error.validation ? { details: error.validation } : {})
    };

    return reply.status(statusCode).send(response);
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  });

  await fastify.register(AutoLoad, {
    dir: join(__dirname, 'modules'),
    options: { ...opts, prefix: '/api' },
    encapsulate: true,
    maxDepth: 2,
    // Match both the TypeScript sources (tsx, tests) and the compiled output
    // (dist/*.js): with a .ts-only pattern the production build loaded every
    // routes file twice and failed with FST_ERR_DUPLICATED_ROUTE.
    indexPattern: /.*plugin\.(ts|js)$/,
    ignorePattern: /.*\.(schema|schemas|service|routes|model)\.(ts|js)$/
  });

};

export default app;
export { app };
