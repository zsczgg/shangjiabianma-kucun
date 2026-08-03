import { describe, expect, it } from 'vitest';
import { InventoryError, nextBalance } from './inventory';

describe('nextBalance', () => {
  it('adds incoming stock', () => expect(nextBalance(3, 'IN', 5)).toBe(8));
  it('subtracts outgoing stock', () => expect(nextBalance(8, 'OUT', 3)).toBe(5));
  it('allows a negative calculation for policy handling', () => expect(nextBalance(1, 'OUT', 3)).toBe(-2));
  it('rejects non-positive quantity', () => expect(() => nextBalance(2, 'IN', 0)).toThrow(InventoryError));
});
