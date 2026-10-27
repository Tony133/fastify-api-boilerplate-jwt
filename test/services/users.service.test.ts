import { test, describe } from 'node:test';
import assert from 'node:assert';
import { UsersService } from '../../src/modules/users/users.service';

/**
 * Minimal chainable Kysely mock. Every builder method returns the mock itself;
 * the terminal methods (`execute*`) are configurable per test and record what
 * was passed to `values()` / `set()` so assertions can inspect them.
 */
function createMockDb(overrides: Record<string, any> = {}) {
  const calls: { values?: any; set?: any } = {};
  const mockDb: any = {
    calls,
    selectFrom: () => mockDb,
    select: () => mockDb,
    selectAll: () => mockDb,
    insertInto: () => mockDb,
    updateTable: () => mockDb,
    deleteFrom: () => mockDb,
    where: () => mockDb,
    returningAll: () => mockDb,
    values: (v: any) => { calls.values = v; return mockDb; },
    set: (v: any) => { calls.set = v; return mockDb; },
    execute: async () => [],
    executeTakeFirst: async () => undefined,
    executeTakeFirstOrThrow: async () => ({}),
    ...overrides
  };
  return mockDb;
}

const mockHashing: any = {
  hash: async (plain: string) => `hashed(${plain})`,
  compare: async () => true
};

const userInput = {
  firstName: 'Mario',
  lastName: 'Rossi',
  email: 'mario.rossi@example.com',
  password: 'Password123!'
};

describe('UsersService', () => {
  test('createUser - should throw 409 if the email is already in use', async () => {
    const mockDb = createMockDb({
      executeTakeFirst: async () => ({ id: 'existing-id' })
    });
    const service = new UsersService(mockDb, mockHashing);

    await assert.rejects(service.createUser(userInput), (err: any) => {
      assert.strictEqual(err.statusCode, 409);
      assert.strictEqual(err.message, 'Email already in use');
      return true;
    });
    assert.strictEqual(mockDb.calls.values, undefined, 'must not insert anything');
  });

  test('createUser - should hash the password and assign the USER role', async () => {
    const mockDb = createMockDb({
      executeTakeFirst: async () => undefined,
      executeTakeFirstOrThrow: async () => ({ id: 'new-id', ...mockDb.calls.values })
    });
    const service = new UsersService(mockDb, mockHashing);

    const created = await service.createUser(userInput);

    assert.strictEqual(created.id, 'new-id');
    assert.strictEqual(mockDb.calls.values.password, 'hashed(Password123!)');
    assert.notStrictEqual(mockDb.calls.values.password, userInput.password, 'plain password must never be stored');
    assert.deepStrictEqual(mockDb.calls.values.roles, ['USER']);
    assert.ok(mockDb.calls.values.dateOfRegistration instanceof Date);
  });

  test('getUsers - should return every user', async () => {
    const users = [{ id: '1' }, { id: '2' }];
    const service = new UsersService(createMockDb({ execute: async () => users }), mockHashing);

    assert.deepStrictEqual(await service.getUsers(), users);
  });

  test('getUserById - should return the user when it exists', async () => {
    const user = { id: '1', email: 'a@b.c' };
    const service = new UsersService(createMockDb({ executeTakeFirst: async () => user }), mockHashing);

    assert.deepStrictEqual(await service.getUserById('1'), user);
  });

  test('getUserById - should throw 404 when the user does not exist', async () => {
    const service = new UsersService(createMockDb(), mockHashing);

    await assert.rejects(service.getUserById('missing'), (err: any) => {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.message, 'User not found');
      return true;
    });
  });

  test('updateUser - should update and return the user', async () => {
    const mockDb = createMockDb({
      executeTakeFirst: async () => ({ id: '1' }),
      executeTakeFirstOrThrow: async () => ({ id: '1', firstName: 'Luigi' })
    });
    const service = new UsersService(mockDb, mockHashing);

    const updated = await service.updateUser('1', { firstName: 'Luigi' });

    assert.strictEqual(updated.firstName, 'Luigi');
    assert.deepStrictEqual(mockDb.calls.set, { firstName: 'Luigi' });
  });

  test('updateUser - should throw 404 when the user does not exist', async () => {
    const mockDb = createMockDb();
    const service = new UsersService(mockDb, mockHashing);

    await assert.rejects(service.updateUser('missing', { firstName: 'X' }), (err: any) => {
      assert.strictEqual(err.statusCode, 404);
      return true;
    });
    assert.strictEqual(mockDb.calls.set, undefined, 'must not run the update');
  });

  test('deleteUser - should resolve when a row was deleted', async () => {
    const service = new UsersService(
      createMockDb({ executeTakeFirst: async () => ({ numDeletedRows: 1n }) }),
      mockHashing
    );

    await assert.doesNotReject(service.deleteUser('1'));
  });

  test('deleteUser - should throw 404 when no row was deleted', async () => {
    const service = new UsersService(
      createMockDb({ executeTakeFirst: async () => ({ numDeletedRows: 0n }) }),
      mockHashing
    );

    await assert.rejects(service.deleteUser('missing'), (err: any) => {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.message, 'User not found');
      return true;
    });
  });
});
