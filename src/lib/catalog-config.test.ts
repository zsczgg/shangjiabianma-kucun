import { afterEach, describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from './catalog-config';

const original = process.env.CONFIG_ENCRYPTION_KEY;
afterEach(() => { process.env.CONFIG_ENCRYPTION_KEY = original; });

describe('catalog config encryption', () => {
  it('round trips a secret without storing plaintext', () => {
    process.env.CONFIG_ENCRYPTION_KEY = 'test-only-encryption-key-with-32-chars';
    const encrypted = encryptSecret('yyapi_example_secret_value');
    expect(encrypted).not.toContain('yyapi_example');
    expect(decryptSecret(encrypted)).toBe('yyapi_example_secret_value');
  });
});
