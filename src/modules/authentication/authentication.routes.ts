
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


const authenticationRoutes: FastifyPluginAsyncTypebox = async (
  fastify: FastifyInstance
): Promise<void> => {
  fastify.post<{ Body: LoginBody }>(
    '/login',
    { schema: loginSchema },
    async function (request, reply) {
      try {
        const { email, password } = request.body;

        if (!email || !password) {
          return reply.status(400).send({
            error: 'Email and password are required'
          });
        }

        const userData = await fastify.authenticationService.login(
          email,
          password
        );
        if (!userData) {
          return reply.status(401).send({ error: 'Invalid email or password' });
        }

        const token = fastify.jwt.sign(
          {
            sub: userData.user.id,
            name: userData.user.firstName,
            email: userData.user.email,
            role: userData.user.roles
          },
          { expiresIn: '2h' }
        );

        return reply.status(200).send({ userData, accessToken: token });
      } catch (error: unknown) {
        const err = error as { statusCode?: number; message?: string; name: string };
        const statusCode = err.statusCode || 500;

        return reply.status(statusCode).send({
          statusCode: statusCode,
          error: 'Invalid email or password',
          message: err.message || 'Authentication failed'
        });
      }
    }
  );

  fastify.post<{ Body: RefreshTokenBody }>(
    '/refresh-token',
    { schema: refreshTokenSchema },
    async function (request, reply) {
      try {
        const { refreshToken } = request.body;

        const decodedToken = await fastify.jwt.verify<
          RefreshTokenPayload & VerifyPayloadType
        >(refreshToken);

        if (!decodedToken) {
          return reply.status(401).send({ error: 'Invalid token' });
        }

        const newAccessToken = fastify.jwt.sign(
          {
            sub: decodedToken.id,
            name: decodedToken.name,
            email: decodedToken.email,
            role: decodedToken.role
          },
          { expiresIn: '3h' }
        );

        return reply.status(200).send({ refreshToken: newAccessToken });
      } catch (error) {
        return reply.status(400).send({ error: 'Invalid refresh token' });
      }
    }
  );

  fastify.get(
    '/is-authenticated',
    {
      preHandler: [fastify.checkToken, fastify.checkRole('USER')],
      schema: isAuthenticationSchema
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const payload = request.user;
        if (!payload) {
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        return reply.status(200).send({ authenticated: true });
      } catch (error) {
        return reply.status(400).send(error);
      }
    }
  );

  fastify.get(
    '/user-authenticated',
    { preHandler: [fastify.checkToken], schema: userAuthenticatedSchema },
    async function (request, reply) {
      try {
        const userId = request.user.sub;
        const result = await fastify.authenticationService.getUserData(userId);
        return reply.status(200).send(result);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({ error: `User not found` });
      }
    }
  );
};

export default authenticationRoutes;
