import Fastify from 'fastify';
import closeWithGrace from 'close-with-grace';
import app, { options } from './app';

// Load .env file
try {
  process.loadEnvFile();
} catch (err) {
  // .env is optional
}

// Instantiate Fastify using the options from app.ts (logger is included)
const server = Fastify(options);

// Register your application as a plugin
server.register(app);

// Graceful shutdown configuration
const closeListeners = closeWithGrace(
  { delay: parseInt(process.env.FASTIFY_CLOSE_GRACE_DELAY ?? '500') || 500 },
  async function ({ err }) {
    if (err) {
      server.log.error(err);
    }
    await server.close();
  }
);

server.addHook('onClose', async () => {
  closeListeners.uninstall();
});

// Start listening
const PORT = parseInt(process.env.FASTIFY_PORT ?? '3000') || 3000;
const HOST = process.env.FASTIFY_ADDRESS ?? '0.0.0.0';

server.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    server.log.error({ err }, 'Server shutdown due to an error');
    process.exit(1);
  }
});
