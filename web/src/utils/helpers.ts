type MSB = number;
type LSB = number;

export function isHex(str: string): boolean {
  return /^[0-9A-Fa-f]*$/.test(str);
}

export function hex(bytes: number | number[], separator: string = ''): string {
  const hexNumber = (number: number) => {
    const hex = number.toString(16).toUpperCase();
    return hex.length % 2 === 0 ? hex : '0' + hex;
  };

  return (typeof bytes === 'number' ? [bytes] : bytes)
    .map(hexNumber)
    .join(separator);
}

export function unhexToArray(str: string): number[] {
  if (!isHex(str)) {
    throw new Error('invalid hex string');
  }

  if (str.length % 2 !== 0) {
    str = '0' + str;
  }

  return Array.from({ length: str.length / 2 }, (_, i) => parseInt(str.slice(i * 2, i * 2 + 2), 16));
}

export function randomHex(bytesLength: number): string {
  return hex(Array.from(crypto.getRandomValues(new Uint8Array(bytesLength))), '');
}

export function bin(bytes: number | number[], separator: string = '', groupSeparator: string = '') {
  const binNumber = (number: number) => {
    const binary = number.toString(2).padStart(8, '0');

    if (groupSeparator.length <= 0) {
      return binary;
    }

    return binary.slice(0, 4) + groupSeparator + binary.slice(4);
  };

  return (typeof bytes === 'number' ? [bytes] : bytes)
    .map(binNumber)
    .join(separator);
}

export function isAsciiPrintable(code: number): boolean {
  return code >= 32 && code <= 126;
}

export function ascii(bytes: number | number[], separator: string = ''): string {
  const asciiNumber = (number: number) => {
    return isAsciiPrintable(number) ? String.fromCharCode(number) : '.';
  };

  return (typeof bytes === 'number' ? [bytes] : bytes)
    .map(asciiNumber)
    .join(separator);
}

export function nibbles(byte: number): [MSB, LSB] {
  return [byte >> 4, byte & 0x0F];
}

function trimStart(str: string, chr: string) {
  while (str.startsWith(chr)) {
    str = str.slice(1);
  }

  return str;
}

function trimEnd(str: string, chr: string) {
  while (str.endsWith(chr)) {
    str = str.slice(0, -1);
  }

  return str;
}

export function trim(str: string, chr: string) {
  return trimEnd(trimStart(str, chr), chr);
}

export function removeWhitespace(str: string) {
  return str.replace(/\s/g, '');
}

export function arraysAreEqual(arr1: any[] | Uint8Array, arr2: any[] | Uint8Array): boolean {
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

export function cloneObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
