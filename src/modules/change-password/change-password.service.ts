import { Kysely } from 'kysely';
import { Database } from '../users/users.model';
import { HashingService } from '../../shared/hashing/hashing.service';
import { httpErrors } from '@fastify/sensible';
import { ChangePasswordDto } from './change-password.schemas';

export class ChangePasswordService {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly hashingService: HashingService
  ) {}

  public async changePassword(userId: string, data: ChangePasswordDto) {

    const user = await this.db
      .selectFrom('users')
      .select(['id', 'password'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!user) {
      throw httpErrors.notFound('User not found');
    }

    const isMatch = await this.hashingService.compare(
      data.oldPassword,
      user.password
    );
    if (!isMatch) {
      throw httpErrors.badRequest('Old password does not match');
    }

    const hashedNewPassword = await this.hashingService.hash(data.newPassword);

    await this.db
      .updateTable('users')
      .set({ password: hashedNewPassword })
      .where('id', '=', userId)
      .execute();

    return { success: true, message: 'Password updated successfully' };
  }
}
