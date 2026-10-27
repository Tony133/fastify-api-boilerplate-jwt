import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { HashingService } from "../shared/hashing/hashing.service";

async function hashingPlugin(fastify: FastifyInstance) {
  const hashingService = new HashingService();
  
  fastify.decorate('hashingService', hashingService);
}

export default fp(hashingPlugin, {
  name: "hashing",
});
