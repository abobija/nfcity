type MSB = number;
type LSB = number;

function num2hex(num: number) {
  const hex = num.toString(16).toUpperCase();

  return hex.length % 2 ? '0' + hex : hex;
}

function arr2hex(arr: Uint8Array) {
  return Array.from(arr).map(num2hex).join(' ');
}

export function hex(bytes: number | Uint8Array) {
  return bytes instanceof Uint8Array ? arr2hex(bytes) : num2hex(bytes);
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
