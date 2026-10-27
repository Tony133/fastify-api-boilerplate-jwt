import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyInstance } from "fastify";
import {
  RegisterBody,
  registerSchema
} from "./register.schema";

const registerRoutes: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.post<{ Body: RegisterBody }>(
    '/',
    { schema: registerSchema },
    async function (request, reply) {
      try {
        const user = request.body;
        const createdUser = await fastify.registerService.register(user);
        return reply.status(201).send(createdUser);
      } catch (err) {
        fastify.log.error(err);
          return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Registration failed'
          });
      }
    }
  );
};

export default registerRoutes;
