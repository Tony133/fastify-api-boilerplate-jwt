import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";

async function helmetPlugin(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    crossOriginResourcePolicy: { policy: 'same-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for Swagger UI and Vite
        styleSrc: ["'self'", "'unsafe-inline'"], // Needed for inline styles
        imgSrc: ["'self'", 'data:', 'blob:'], // Allow data URIs for images
        fontSrc: ["'self'"],
        connectSrc: ["'self'", 'http://localhost:3001'], // For API calls and SSE
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // Prevent clickjacking
        upgradeInsecureRequests: null // Disable for local HTTP development
      }
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    originAgentCluster: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    xDownloadOptions: true,
    xFrameOptions: { action: 'deny' },
    xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xXssProtection: true
  });
}

export default fp(helmetPlugin, {
  name: "helmet"
});
