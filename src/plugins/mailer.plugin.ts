import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { MailerService } from '../shared/mailer/mailer.service';

async function mailerPlugin(fastify: FastifyInstance) {
  const { config } = fastify;

  // Allows tests (see test/helper.ts) to inject a mock mailer before the app
  // is registered, instead of failing with FST_ERR_DEC_ALREADY_PRESENT.
  if (fastify.hasDecorator('mailerService')) {
    fastify.log.debug('mailerService already registered, skipping real mailer');
    return;
  }

  const emailConfig = {
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_SECURE,
    auth: {
      user: config.EMAIL_AUTH_USER,
      pass: config.EMAIL_AUTH_PASSWORD
    },
    from: {
      name: config.EMAIL_FROM_NAME,
      email: config.EMAIL_FROM_EMAIL
    },
    logger: config.EMAIL_LOGGER,
    debug: config.EMAIL_DEBUG
  };

  const mailerService = new MailerService(emailConfig);
  fastify.decorate('mailerService', mailerService);
}

export default fp(mailerPlugin, {
  name: 'mailer',
  dependencies: ['config']
});
