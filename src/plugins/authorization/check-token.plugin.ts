import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function checkTokenPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    "checkToken",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        fastify.log.error(err);
        // In an async hook the reply must be returned after sending, otherwise
        // Fastify continues the lifecycle and reaches the route handler.
        return reply.send(err);
      }
    }
  );
}

export default fp(checkTokenPlugin, {
  name: 'check-token',
});
