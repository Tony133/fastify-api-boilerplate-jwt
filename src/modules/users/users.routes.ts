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
import { Role } from "../../shared/enums/role.enum";

// User management is an administrative concern: every route requires the ADMIN role.
const usersRoutes: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {

  fastify.post<{ Body: CreateUserDto }>(
    "/",
    {
      preHandler: [fastify.checkToken, fastify.checkRole(Role.ADMIN)],
      schema: createUserSchema
    },
    async (request, reply) => {
      // Service errors (e.g. 409 on duplicate email) are HttpErrors and are
      // rendered by the global error handler with a schema-compliant body.
      const user = await fastify.usersService.createUser(request.body);
      return reply.code(201).send(user);
    }
  );

  fastify.get(
    "/",
    {
      preHandler: [fastify.checkToken, fastify.checkRole(Role.ADMIN)],
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
      preHandler: [fastify.checkToken, fastify.checkRole(Role.ADMIN)],
      schema: getUserSchema
    },
    async (request, reply) => {
      // getUserById throws a 404 HttpError when the user does not exist
      const user = await fastify.usersService.getUserById(request.params.id);
      return reply.send(user);
    }
  );

  fastify.put<{ Params: UserParams; Body: UpdateUserDto }>(
    "/:id",
    {
      preHandler: [fastify.checkToken, fastify.checkRole(Role.ADMIN)],
      schema: updateUserSchema
    },
    async (request, reply) => {
      const user = await fastify.usersService.updateUser(
        request.params.id,
        request.body
      );
      return reply.send(user);
    }
  );

  fastify.delete<{ Params: UserParams }>(
    "/:id",
    {
      preHandler: [fastify.checkToken, fastify.checkRole(Role.ADMIN)],
      schema: deleteUserSchema
    },
    async (request, reply) => {
      await fastify.usersService.deleteUser(request.params.id);
      return reply.status(204).send();
    }
  );
};

export default usersRoutes;
