import { Kysely } from 'kysely';
import { Database } from '../users/users.model';
import { httpErrors } from '@fastify/sensible';
import { ForgotPasswordDto } from './forgot-password.schemas';
import { HashingService } from '../../shared/hashing/hashing.service';
import * as crypto from 'crypto';
import { MailerService } from '../../shared/mailer/mailer.service';
import { FastifyBaseLogger } from 'fastify';

const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account exists for this email, a temporary password has been sent'
};

export class ForgotPasswordService {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly hashingService: HashingService,
    private readonly mailerService: MailerService,
    private readonly logger?: FastifyBaseLogger
  ) {}

  public async forgotPassword(data: ForgotPasswordDto) {
    const user = await this.db
      .selectFrom('users')
      .select(['id', 'email'])
      .where('email', '=', data.email)
      .executeTakeFirst();

    // Unknown email: answer exactly like the success case so the endpoint
    // cannot be used to discover which addresses are registered.
    if (!user) {
      this.logger?.info({ email: data.email }, 'Password reset requested for unknown email');
      return GENERIC_RESPONSE;
    }

    const temporaryPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await this.hashingService.hash(temporaryPassword);

    // Send the email FIRST and wait for the result: the stored password is
    // replaced only once we know the user will actually receive the new one,
    // otherwise a transient SMTP failure would lock the user out.
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Your Temporary Password',
        html: `<p>Your new temporary password is: <b>${temporaryPassword}</b></p>`
      });
    } catch (err) {
      this.logger?.error({ err, userId: user.id }, 'Failed to send reset email');
      throw httpErrors.internalServerError(
        'Failed to send reset email. Please try again later.'
      );
    }

    await this.db
      .updateTable('users')
      .set({ password: hashedPassword })
      .where('id', '=', user.id)
      .execute();

    return GENERIC_RESPONSE;
  }
}
