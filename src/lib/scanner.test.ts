import { describe, expect, it } from 'vitest';
import { isScannerCharacter, isScannerValue } from './scanner';

describe('scanner input filtering', () => {
  it('accepts English barcode characters', () => {
    expect(isScannerValue('yyhxfz000001')).toBe(true);
    expect(isScannerValue('SKU-01_02/03:04.5')).toBe(true);
  });

  it('rejects Chinese and full-width input', () => {
    expect(isScannerValue('商品001')).toBe(false);
    expect(isScannerValue('ＳＫＵ００１')).toBe(false);
    expect(isScannerCharacter('中')).toBe(false);
  });
});

