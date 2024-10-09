type MSB = number;
type LSB = number;

function num2hex(num: number): string {
  const hex = num.toString(16).toUpperCase();

  return hex.length % 2 ? '0' + hex : hex;
}

function arr2hex(arr: Uint8Array, separator: string = ' '): string {
  return Array.from(arr).map(num2hex).join(separator);
}

export function hex(bytes: number | Uint8Array, separator: string = ' '): string {
  return bytes instanceof Uint8Array ? arr2hex(bytes, separator) : num2hex(bytes);
}

export function isHex(str: string): boolean {
  return /^[0-9A-Fa-f]*$/.test(str);
}

export function hex2arr(hex: string): Uint8Array {
  if (!isHex(hex)) {
    throw new Error('Invalid hex string');
  }

  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }

  return new Uint8Array(
    Array.from({ length: hex.length / 2 }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16))
  );
}

// convert number to binary, and join groups of for bits with a separator
// without tailing separator
function num2bin(num: number, groupSeparator: string = '') {
  const binary = num.toString(2).padStart(8, '0');

  if (groupSeparator.length <= 0) {
    return binary;
  }

  return binary.slice(0, 4) + groupSeparator + binary.slice(4);
}

function arr2bin(arr: Uint8Array, groupSeparator: string = '') {
  return Array.from(arr).map(el => num2bin(el, groupSeparator)).join(' ');
}

export function bin(bytes: number | Uint8Array, groupSeparator: string = '') {
  return bytes instanceof Uint8Array ? arr2bin(bytes, groupSeparator) : num2bin(bytes, groupSeparator);
}

export function randomBytes(length: number) {
  return new Uint8Array(
    Array.from({ length }, () => Math.floor(Math.random() * 0xFF))
  );
}

export function isAsciiPrintable(code: number): boolean {
  return code >= 32 && code <= 126;
}

function num2ascii(num: number): string {
  return isAsciiPrintable(num) ? String.fromCharCode(num) : '.';
}

function arr2ascii(arr: Uint8Array, separator: string = ''): string {
  return Array.from(arr).map(num2ascii).join(separator);
}

export function ascii(bytes: number | Uint8Array, separator: string = ''): string {
  return bytes instanceof Uint8Array ? arr2ascii(bytes, separator) : num2ascii(bytes);
}

export function nibbles(byte: number): [MSB, LSB] {
  return [byte >> 4, byte & 0x0F];
}

export function trimStart(str: string, chr: string) {
  while (str.startsWith(chr)) {
    str = str.slice(1);
  }

  return str;
}

export function trimEnd(str: string, chr: string) {
  while (str.endsWith(chr)) {
    str = str.slice(0, -1);
  }

  return str;
}

export function trimLeft(str: string, chr: string) {
  return trimStart(str, chr);
}

export function trimRight(str: string, chr: string) {
  return trimEnd(str, chr);
}

export function trim(str: string, chr: string) {
  return trimEnd(trimStart(str, chr), chr);
}

export function arrEquals(arr1: Uint8Array, arr2: Uint8Array): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every((el, i) => el === arr2[i]);
}

export interface StrMaskOptions {
  char?: string;
  side?: 'left' | 'right';
  offset?: number;
  ratio?: number;
}

export function strmask(str: string, opts?: StrMaskOptions): string {
  const char = opts?.char ?? '*';
  const side = opts?.side ?? 'right';
  const offset = opts?.offset ?? 1;
  const ratio = opts?.ratio ?? 0.5;
  const length = str.length * ratio;
  const mask = char.repeat(Math.min(3, length));

  return side === 'left'
    ? str.slice(0, offset) + mask + str.slice(offset + length)
    : str.slice(0, -offset - length) + mask + str.slice(-offset);
};
