import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AuthenticationService } from '../../src/modules/authentication/authentication.service';

describe('AuthenticationService', () => {
  const createMockDb = () => {
    const mock: any = {
      selectFrom: () => mock,
      selectAll: () => mock,
      where: () => mock,
      updateTable: () => mock,
      set: () => mock,
      executeTakeFirst: async () => null,
      execute: async () => ({ numUpdatedRows: 1n })
    };
    return mock;
  };

  const mockDb = createMockDb();
  const mockHash: any = { compare: async () => true };
  const service = new AuthenticationService(mockDb, mockHash);

  test('login - should throw 401 (generic message) if user is not found', async () => {
    mockDb.executeTakeFirst = async () => null;

    await assert.rejects(
      service.login('wrong@email.com', 'password'),
      (err: any) => {
        // Same status and message as a wrong password: no user enumeration
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.message, 'Invalid email or password');
        return true;
      }
    );
  });

  test('login - should throw 401 if password is incorrect', async () => {
    mockDb.executeTakeFirst = async () => ({
      email: 'test@test.com',
      password: 'hash'
    });
    mockHash.compare = async () => false;

    await assert.rejects(
      service.login('test@test.com', 'wrong-password'),
      (err: any) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.message, 'Invalid email or password');
        return true;
      }
    );
  });

  test('login - should return success and update access date', async () => {
    const user = { id: '1', email: 'test@test.com', password: 'hash' };
    mockDb.executeTakeFirst = async () => user;
    mockHash.compare = async () => true;

    const result = await service.login('test@test.com', 'password');
    assert.strictEqual(result.success, true);
    assert.ok(result.user);
  });
});
