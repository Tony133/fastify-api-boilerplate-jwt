import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

async function checkRolePlugin(fastify: FastifyInstance) {
  fastify.decorate("checkRole", (requiredRole: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (typeof user === "object" && user !== null && "role" in user) {
        const roles = user.role;
        const userRole = roles[0];
        if (userRole !== requiredRole) {
          reply.code(403).send({ message: "Insufficient permissions" });
          return;
        }
      } else {
        reply.code(400).send({ message: "Invalid user information" });
        return;
      }
    };
  });

  fastify.decorateRequest("checkRole", (requiredRole: string) => {
    return fastify.checkRole(requiredRole);
  });
}

export default fp(checkRolePlugin, {
  name: 'check-role',
});
