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
      'If an account exists for this email, a temporary password has been sent'
    );
  });
  
  test('forgotPassword - should answer like the success case if user does not exist', async () => {
    let mailSent = false;
    const mockDbNotFound: any = {
      selectFrom: () => mockDbNotFound,
      select: () => mockDbNotFound,
      where: () => mockDbNotFound,
      executeTakeFirst: async () => undefined
    };
    const spyMailer: any = { sendMail: async () => { mailSent = true; } };

    const logs: unknown[] = [];
    const logger: any = { info: (o: unknown) => logs.push(o), error: (o: unknown) => logs.push(o) };
    const serviceNotFound = new ForgotPasswordService(
      mockDbNotFound,
      mockHashing,
      spyMailer,
      logger
    );

    const result = await serviceNotFound.forgotPassword({
      email: 'nonexistent@example.com'
    });

    // No user enumeration: same shape/message as the success case, and no email sent
    assert.strictEqual(result.success, true);
    assert.strictEqual(mailSent, false);
    assert.strictEqual(logs.length, 1, 'the unknown email is logged');
  });

  test('forgotPassword - should work without a logger', async () => {
    const mockDbNotFound: any = {
      selectFrom: () => mockDbNotFound,
      select: () => mockDbNotFound,
      where: () => mockDbNotFound,
      executeTakeFirst: async () => undefined
    };
    const service = new ForgotPasswordService(mockDbNotFound, mockHashing, mockMailer);

    const result = await service.forgotPassword({ email: 'nobody@example.com' });
    assert.strictEqual(result.success, true);
  });

  test('forgotPassword - should NOT overwrite the password if the email cannot be sent', async () => {
    let passwordUpdated = false;
    const mockDbFound: any = {
      selectFrom: () => mockDbFound,
      select: () => mockDbFound,
      where: () => mockDbFound,
      executeTakeFirst: async () => ({ id: '1', email: 'test@example.com' }),
      updateTable: () => ({
        set: () => ({
          where: () => ({ execute: async () => { passwordUpdated = true; } })
        })
      })
    };
    const failingMailer: any = {
      sendMail: async () => { throw new Error('SMTP down'); }
    };

    const errors: unknown[] = [];
    const logger: any = { info: () => {}, error: (o: unknown) => errors.push(o) };
    const service = new ForgotPasswordService(mockDbFound, mockHashing, failingMailer, logger);

    await assert.rejects(
      service.forgotPassword({ email: 'test@example.com' }),
      (err: any) => {
        assert.strictEqual(err.statusCode, 500);
        return true;
      }
    );
    assert.strictEqual(passwordUpdated, false, 'password must stay unchanged when the email fails');
    assert.strictEqual(errors.length, 1, 'the SMTP failure is logged');
  });

  test('forgotPassword - should throw 500 on SMTP failure even without a logger', async () => {
    const mockDbFound: any = {
      selectFrom: () => mockDbFound,
      select: () => mockDbFound,
      where: () => mockDbFound,
      executeTakeFirst: async () => ({ id: '1', email: 'test@example.com' })
    };
    const failingMailer: any = { sendMail: async () => { throw new Error('SMTP down'); } };
    const service = new ForgotPasswordService(mockDbFound, mockHashing, failingMailer);

    await assert.rejects(service.forgotPassword({ email: 'test@example.com' }), (err: any) => {
      assert.strictEqual(err.statusCode, 500);
      return true;
    });
  });
});
