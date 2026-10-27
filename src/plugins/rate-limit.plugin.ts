import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";

async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute"
  });
}

export default fp(rateLimitPlugin, {
  name: "rate-limit"
});
