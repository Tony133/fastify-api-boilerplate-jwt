import { FastifyInstance } from 'fastify';
import fastifyUnderPressure from '@fastify/under-pressure';
import fp from 'fastify-plugin';
import { sql } from 'kysely';

/** Reports the service as unhealthy when the database does not answer. */
export async function databaseHealthCheck(fastify: FastifyInstance): Promise<boolean> {
  try {
    await sql`SELECT 1`.execute(fastify.database);
    return true;
  } catch (err) {
    fastify.log.error({ err }, 'Health check failed: Database connection error');
    return false;
  }
}

async function underPressurePlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyUnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 100_000_000,
    maxRssBytes: 1_000_000_000,
    maxEventLoopUtilization: 0.98,
    message: 'Server under heavy load, please try again later.',
    retryAfter: 50,
    healthCheck: () => databaseHealthCheck(fastify),
    healthCheckInterval: 5000
  });
}

export default fp(underPressurePlugin, {
  name: 'under-pressure',
  dependencies: ['database']
});
