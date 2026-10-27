import { Kysely } from 'kysely';
import { HashingService } from '../../shared/hashing/hashing.service';
import { httpErrors } from '@fastify/sensible';
import { CreateUserDto, UpdateUserDto } from './users.schema';
import { Database } from './users.model';

export class UsersService {
  constructor(
    private readonly db: Kysely<Database>,
    private readonly hashingService: HashingService
  ) {}

  public async createUser(data: CreateUserDto) {
    const exists = await this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', data.email)
      .executeTakeFirst();

    if (exists) throw httpErrors.conflict('Email already in use');

    const hashedPassword = await this.hashingService.hash(data.password);

    return await this.db
      .insertInto('users')
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        roles: ['USER'],
        dateOfRegistration: new Date(),
        dateOfLastAccess: new Date()
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async getUsers() {
    return await this.db.selectFrom('users').selectAll().execute();
  }

  public async getUserById(id: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw httpErrors.notFound('User not found');
    }

    return user;
  }

  public async updateUser(id: string, data: UpdateUserDto) {
    await this.getUserById(id);


    return await this.db
      .updateTable('users')
      .set({
        ...data
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async deleteUser(id: string) {
    const result = await this.db
      .deleteFrom('users')
      .where('id', '=', id)
      .executeTakeFirst();

    if (Number(result.numDeletedRows) === 0) {
      throw httpErrors.notFound('User not found');
    }
  }
}
