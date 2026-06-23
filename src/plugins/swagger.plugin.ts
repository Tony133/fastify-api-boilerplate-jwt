import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import Swagger from "@fastify/swagger";
import SwaggerUI from "@fastify/swagger-ui";
import fastifyBasicAuth from "@fastify/basic-auth";

async function swaggerGeneratorPlugin(fastify: FastifyInstance) {
  const { config } = fastify;

  fastify.register(fastifyBasicAuth, {
    validate: (username: string, password: string, req, reply, done) => {
      if (
        username === config.SWAGGER_USER &&
        password === config.SWAGGER_PASSWORD
      ) {
        done();
      } else {
        fastify.log.error('Unauthorized');
        done(new Error('Unauthorized'));
      }
    },
    authenticate: true
  });


  await fastify.register(Swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'API',
        description: 'The Swagger API documentation for the project',
        version: '1.0.0'
      },
      tags: [
        {
          name: 'register',
          description: 'API by register'
        },
        {
          name: 'authentication',
          description: 'API by authentication'
        },
        {
          name: 'forgot-password',
          description: 'API by forgot password'
        },
        {
          name: 'change-password',
          description: 'API by change password'
        },
        {
          name: 'users',
          description: 'API by management users'
        },
        {
          name: 'default',
          description: 'API default'
        }
      ],
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Local development server'
        }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description:
              'Enter the JWT token only. The "Bearer" prefix will be added automatically'
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ]
    }
  });

  await fastify.register(SwaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      filter: true
    },
    uiHooks: {
      onRequest: fastify.basicAuth,
    },
  });

  fastify.log.debug("Open API Swagger documentation is available at /docs");
}

export default fp(swaggerGeneratorPlugin, {
  name: "swagger"
});
