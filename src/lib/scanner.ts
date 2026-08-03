export const SCANNER_CHAR = /^[\x20-\x7E]$/;
export const SCANNER_VALUE = /^[\x20-\x7E]*$/;

export function isScannerCharacter(value: string) {
  return SCANNER_CHAR.test(value);
}

export function isScannerValue(value: string) {
  return SCANNER_VALUE.test(value);
}

