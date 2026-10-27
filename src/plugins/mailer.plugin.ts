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

  // Same rule as the database plugin: EMAIL_TEST_* never applies in production.
  const t = config.NODE_ENV !== 'production';

  const emailConfig = {
    host: (t && config.EMAIL_TEST_HOST) || config.EMAIL_HOST,
    port: (t && config.EMAIL_TEST_PORT) || config.EMAIL_PORT,
    secure: (t ? config.EMAIL_TEST_SECURE : undefined) ?? config.EMAIL_SECURE,
    auth: {
      user: (t && config.EMAIL_TEST_AUTH_USER) || config.EMAIL_AUTH_USER,
      pass: (t && config.EMAIL_TEST_AUTH_PASSWORD) || config.EMAIL_AUTH_PASSWORD
    },
    from: {
      name: (t && config.EMAIL_TEST_FROM_NAME) || config.EMAIL_FROM_NAME,
      email: (t && config.EMAIL_TEST_FROM_EMAIL) || config.EMAIL_FROM_EMAIL
    },
    logger: (t ? config.EMAIL_TEST_LOGGER : undefined) ?? config.EMAIL_LOGGER,
    debug: (t ? config.EMAIL_TEST_DEBUG : undefined) ?? config.EMAIL_DEBUG
  };

  const mailerService = new MailerService(emailConfig);
  fastify.decorate('mailerService', mailerService);
}

export default fp(mailerPlugin, {
  name: 'mailer',
  dependencies: ['config']
});
