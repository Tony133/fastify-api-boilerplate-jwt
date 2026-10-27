import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { publicSchema, secureSchema } from "./index.schema";

const indexRoutes: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance,
): Promise<void> => {
  fastify.get(
    '/',
    {
      schema: publicSchema
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      return {
        message: 'This is a simple example of item returned by your APIs'
      };
    }
  );

  fastify.get(
    '/secure',
    {
      preHandler: [fastify.checkToken],
      schema: secureSchema
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      return {
        message:
          'Access to protected resource granted! This protected resource is displayed when the token is successfully provided.'
      };
    }
  );
};

export default indexRoutes;
