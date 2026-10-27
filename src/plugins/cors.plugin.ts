import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import Cors from "@fastify/cors";

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(Cors, {
    origin: true,
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400 // 24 hours
  });
}

export default fp(corsPlugin, {
  name: "cors"
});
