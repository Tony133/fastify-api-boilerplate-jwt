import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ChangePasswordService } from '../../src/modules/change-password/change-password.service';

describe('ChangePasswordService', () => {
  let service: ChangePasswordService;

  test('changePassword - should throw error if old password is wrong', async () => {
    const mockDb: any = {
      selectFrom: () => mockDb,
      select: () => mockDb,
      where: () => mockDb,
      executeTakeFirst: async () => ({ id: '1', password: 'hashed_old' })
    };

    const mockHashing: any = {
      compare: async () => false
    };

    service = new ChangePasswordService(mockDb, mockHashing);

    try {
      await service.changePassword('1', {
        oldPassword: 'wrong',
        newPassword: 'new123456'
      });
      assert.fail('Should have thrown an error');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Old password does not match');
      assert.strictEqual(err.statusCode, 400);
    }
  });

  test('changePassword - should successfully change password when data is correct', async () => {
    const mockDbSuccess: any = {
      selectFrom: () => mockDbSuccess,
      select: () => mockDbSuccess,
      where: () => mockDbSuccess,
      executeTakeFirst: async () => ({ id: '1', password: 'hashed_old' }),
      updateTable: () => mockDbSuccess,
      set: () => mockDbSuccess,
      execute: async () => {}
    };

    const mockHashingSuccess: any = {
      compare: async () => true,
      hash: async () => 'new_hashed_password'
    };

    const serviceSuccess = new ChangePasswordService(
      mockDbSuccess,
      mockHashingSuccess
    );
    const result = await serviceSuccess.changePassword('1', {
      oldPassword: 'correct_old',
      newPassword: 'new_secure_password'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.message, 'Password updated successfully');
  });

  test('changePassword - should throw 404 if user is not found', async () => {
    const mockDbNoUser: any = {
      selectFrom: () => mockDbNoUser,
      select: () => mockDbNoUser,
      where: () => mockDbNoUser,
      executeTakeFirst: async () => undefined
    };

    const serviceNoUser = new ChangePasswordService(mockDbNoUser, {} as any);

    try {
      await serviceNoUser.changePassword('999', {
        oldPassword: 'any',
        newPassword: 'any'
      });
      assert.fail('Should have thrown 404');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 404);
    }
  });
});
