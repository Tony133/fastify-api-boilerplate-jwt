
import { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import {
  loginSchema,
  isAuthenticationSchema,
  refreshTokenSchema,
  LoginBody,
  RefreshTokenBody,
  RefreshTokenPayload,
  userAuthenticatedSchema,
} from "./authentication.schema";
import { VerifyPayloadType } from "@fastify/jwt";

// Brute-force protection: stricter limit than the global one for credential endpoints
const LOGIN_RATE_LIMIT = { max: 10, timeWindow: '1 minute' };

const authenticationRoutes: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance
): Promise<void> => {
  const { config } = fastify;

  const issueTokens = (user: { id: string; firstName: string; email: string; roles: string[] }) => {
    const accessToken = fastify.jwt.sign(
      {
        sub: user.id,
        name: user.firstName,
        email: user.email,
        role: user.roles
      },
      { expiresIn: config.JWT_ACCESS_TOKEN_EXPIRES_IN }
    );

    // The refresh token carries only the subject and a type discriminator,
    // so it cannot be used as an access token and vice versa.
    const refreshToken = fastify.jwt.sign(
      { sub: user.id, type: 'refresh' } satisfies RefreshTokenPayload,
      { expiresIn: config.JWT_REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  };

  fastify.post<{ Body: LoginBody }>(
    '/login',
    { schema: loginSchema, config: { rateLimit: LOGIN_RATE_LIMIT } },
    async function (request, reply) {
      try {
        const { email, password } = request.body;

        const userData = await fastify.authenticationService.login(
          email,
          password
        );

        const tokens = issueTokens(userData.user);

        // Never expose the password hash: strip it explicitly in addition to
        // the response schema (defence in depth).
        const { password: _password, ...safeUser } = userData.user;

        return reply.status(200).send({
          userData: { user: safeUser, success: userData.success },
          ...tokens
        });
      } catch (error: unknown) {
        // Anything that is not a credentials failure (e.g. database down) is an
        // unexpected error and is rendered by the global error handler.
        if ((error as { statusCode?: number }).statusCode !== 401) {
          throw error;
        }

        // Same generic message for unknown user and wrong password (no user enumeration)
        return reply.status(401).send({
          statusCode: 401,
          error: 'Invalid email or password',
          message: 'Invalid email or password'
        });
      }
    }
  );

  fastify.post<{ Body: RefreshTokenBody }>(
    '/refresh-token',
    { schema: refreshTokenSchema, config: { rateLimit: LOGIN_RATE_LIMIT } },
    async function (request, reply) {
      let decodedToken: RefreshTokenPayload & VerifyPayloadType;
      try {
        decodedToken = await fastify.jwt.verify<RefreshTokenPayload & VerifyPayloadType>(
          request.body.refreshToken
        );
      } catch (error) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }

      // Reject access tokens (or any other JWT signed with the same secret)
      if (decodedToken.type !== 'refresh' || !decodedToken.sub) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }

      try {
        // Re-read the user so a deleted user (or changed roles) is reflected immediately
        const user = await fastify.authenticationService.getUserData(decodedToken.sub);
        const tokens = issueTokens(user);
        return reply.status(200).send(tokens);
      } catch (error) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid refresh token'
        });
      }
    }
  );

  fastify.get(
    '/is-authenticated',
    {
      preHandler: [fastify.checkToken, fastify.checkRole('USER')],
      schema: isAuthenticationSchema
    },
    async function (_request: FastifyRequest, reply: FastifyReply) {
      // checkToken has already rejected the request if the JWT is missing/invalid
      return reply.status(200).send({ authenticated: true });
    }
  );

  fastify.get(
    '/user-authenticated',
    { preHandler: [fastify.checkToken], schema: userAuthenticatedSchema },
    async function (request, reply) {
      // A valid token whose user has since been deleted yields the service's 404
      const result = await fastify.authenticationService.getUserData(request.user.sub);
      return reply.status(200).send(result);
    }
  );
};

export default authenticationRoutes;
