import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { ForgotPasswordService } from '../../src/modules/forgot-password/forgot-password.service';

describe('ForgotPasswordService', () => {
  let service: ForgotPasswordService;
  let mockDb: any;
  let mockMailer: any;
  let mockHashing: any;

  before(() => {
    mockDb = {
      selectFrom: () => mockDb,
      select: () => mockDb,
      where: () => mockDb,
      executeTakeFirst: async () => ({ id: '1', email: 'test@example.com' }),
      updateTable: () => mockDb,
      set: () => mockDb,
      execute: async () => {}
    };

    mockMailer = {
      sendMail: async () => ({ success: true })
    };

    mockHashing = {
      hash: async (p: string) => `hashed_${p}`
    };

    service = new ForgotPasswordService(mockDb, mockHashing, mockMailer);
  });

  test('forgotPassword - should flow correctly when user exists', async () => {
    const result = await service.forgotPassword({ email: 'test@example.com' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(
      result.message,
      'A temporary password has been sent to your email'
    );
  });
  
  test('forgotPassword - should throw 404 if user does not exist', async () => {
    const mockDbNotFound: any = {
      selectFrom: () => mockDbNotFound,
      select: () => mockDbNotFound,
      where: () => mockDbNotFound,
      executeTakeFirst: async () => undefined
    };

    const serviceNotFound = new ForgotPasswordService(
      mockDbNotFound,
      mockHashing,
      mockMailer
    );

    try {
      await serviceNotFound.forgotPassword({
        email: 'nonexistent@example.com'
      });
      assert.fail('Should have thrown an error');
    } catch (err: any) {
      assert.strictEqual(err.statusCode, 404);
      assert.strictEqual(err.message, 'User not found');
    }
  });
});
