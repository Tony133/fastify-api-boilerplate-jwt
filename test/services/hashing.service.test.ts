import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HashingService } from '../../src/shared/hashing/hashing.service';

describe('HashingService', () => {
  const hashingService = new HashingService();
  const password = 'mySecretPassword123';

  it('should generate a valid hash (not return the plain string)', async () => {
    const hash = await hashingService.hash(password);

    assert.notStrictEqual(hash, password);
    assert.strictEqual(typeof hash, 'string');
    // Argon2 hashes typically start with $argon2id$
    assert.ok(hash.startsWith('$argon2id$'));
  });

  it('should return true when comparing the correct password with the hash', async () => {
    const hash = await hashingService.hash(password);
    const isValid = await hashingService.compare(password, hash);

    assert.strictEqual(isValid, true);
  });

  it('should return false when comparing an incorrect password', async () => {
    const hash = await hashingService.hash(password);
    const isInvalid = await hashingService.compare('wrongPassword', hash);

    assert.strictEqual(isInvalid, false);
  });

  it('should generate different hashes for the same password (unique salt)', async () => {
    const hash1 = await hashingService.hash(password);
    const hash2 = await hashingService.hash(password);

    assert.notStrictEqual(hash1, hash2);
  });
});
