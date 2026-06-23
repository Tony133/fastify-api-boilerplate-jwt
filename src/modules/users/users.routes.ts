import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import {
  createUserSchema,
  getAllUsersSchema,
  getUserSchema,
  updateUserSchema,
  deleteUserSchema,
  CreateUserDto,
  UpdateUserDto,
  UserParams
} from "./users.schema";
import { FastifyInstance } from "fastify";

const usersRoutes: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {

  fastify.post<{ Body: CreateUserDto }>(
    "/",
    {
      preHandler: [fastify.checkToken],
      schema: createUserSchema
    },
    async (request, reply) => {
      try {
        const user = await fastify.usersService.createUser(request.body);
        return reply.code(201).send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.code(400).send({ error: "Error creating user" });
      }
    }
  );

  fastify.get(
    "/",
    {
      preHandler: [fastify.checkToken],
      schema: getAllUsersSchema
    },
    async (_, reply) => {
      const users = await fastify.usersService.getUsers();
      return reply.send(users);
    }
  );

  fastify.get<{ Params: UserParams }>(
    "/:id",
    {
      preHandler: [fastify.checkToken],
      schema: getUserSchema
    },
    async (request, reply) => {
      const user = await fastify.usersService.getUserById(request.params.id);
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }
      return reply.send(user);
    }
  );

  fastify.put<{ Params: UserParams; Body: UpdateUserDto }>(
    "/:id",
    {
      preHandler: [fastify.checkToken],
      schema: updateUserSchema
    },
    async (request, reply) => {
      try {
        const user = await fastify.usersService.updateUser(
          request.params.id,
          request.body
        );
        return reply.send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.code(400).send({ error: "Error updating user" });
      }
    }
  );

  fastify.delete<{ Params: UserParams }>(
    "/:id",
    {
      preHandler: [fastify.checkToken],
      schema: deleteUserSchema
    },
    async (request, reply) => {
      await fastify.usersService.deleteUser(request.params.id);
      return reply.status(204).send();
    }
  );
};

export default usersRoutes;
