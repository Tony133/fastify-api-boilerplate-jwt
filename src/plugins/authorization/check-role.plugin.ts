import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

/**
 * Normalises the `role` claim of the JWT into an array of role names.
 * The login endpoint signs an array (`user.roles`), but a single string is
 * also accepted so hand-crafted tokens keep working.
 */
function extractRoles(user: unknown): string[] | null {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return null;
  }
  const role = (user as { role: unknown }).role;
  if (typeof role === "string") return [role];
  if (Array.isArray(role) && role.every((r) => typeof r === "string")) {
    return role;
  }
  return null;
}

async function checkRolePlugin(fastify: FastifyInstance) {
  fastify.decorate("checkRole", (requiredRole: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const roles = extractRoles(request.user);

      if (roles === null) {
        return reply.code(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Invalid user information"
        });
      }

      // Checks every role the user has, not only the first one
      if (!roles.includes(requiredRole)) {
        return reply.code(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: "Insufficient permissions"
        });
      }
    };
  });
}

export default fp(checkRolePlugin, {
  name: 'check-role',
});
