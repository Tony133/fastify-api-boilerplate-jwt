import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RegisterService } from '../../src/modules/register/register.service';

describe('RegisterService', () => {
  const createMockDb = () => {
    const mock: any = {
      selectFrom: () => mock,
      select: () => mock,
      where: () => mock,
      insertInto: () => mock,
      values: () => mock,
      returningAll: () => mock,
      executeTakeFirst: async () => null,
      executeTakeFirstOrThrow: async () => ({ id: 'new-id' })
    };
    return mock;
  };

  const mockDb = createMockDb();
  const mockHash: any = { hash: async () => 'secure_hash' };
  const service = new RegisterService(mockDb, mockHash);

  test('register - should successfully create a new user', async () => {
    mockDb.executeTakeFirst = async () => null; // No duplicate found

    const data = {
      email: 'new@user.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    const result = await service.register(data as any);
    assert.strictEqual(result.id, 'new-id');
  });

  test('register - should throw 409 if user already exists', async () => {
    mockDb.executeTakeFirst = async () => ({ id: 'exists' });

    await assert.rejects(
      service.register({ email: 'existing@test.com' } as any),
      (err: any) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.message, 'User already registered');
        return true;
      }
    );
  });

  test('register - should throw 400 if the password is missing', async () => {
    const mockDb: any = {
      selectFrom: () => mockDb,
      select: () => mockDb,
      where: () => mockDb,
      executeTakeFirst: async () => undefined
    };
    const service = new RegisterService(mockDb, { hash: async () => 'h' } as any);

    await assert.rejects(
      service.register({ firstName: 'No', lastName: 'Pass', email: 'nopass@example.com', password: '' } as any),
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.message, 'Password is required');
        return true;
      }
    );
  });
});
