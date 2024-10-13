export function isHex(str: string): boolean {
  return /^[0-9A-Fa-f]*$/.test(str);
}

export function hex(bytes: number | number[], separator: string = ''): string {
  if (!Number.isInteger(bytes) && !Array.isArray(bytes)) {
    throw new Error('invalid input to hex');
  }

  const hexNumber = (number: number) => {
    const hex = number.toString(16).toUpperCase();
    return hex.length % 2 === 0 ? hex : '0' + hex;
  };

  return (typeof bytes === 'number' ? [bytes] : bytes)
    .map(hexNumber)
    .join(separator);
}

export function unhexToArray(str: string): number[] {
  if (typeof str !== 'string') {
    throw new Error('invalid input to unhexToArray');
  }

  str = removeWhitespace(str);

  if (str.length <= 0) {
    return [];
  }

  if (!isHex(str)) {
    throw new Error('invalid hex string');
  }

  if (str.length % 2 !== 0) {
    str = str.slice(0, -1) + '0' + str.slice(-1);
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

export function nibbles(byte: number): [msb: number, lsb: number] {
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

export function strmask(
  str: string,
  opts?: {
    char?: string;
    side?: 'left' | 'right';
    offset?: number;
    ratio?: number;
  }
): string {
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

export function overwriteArraySegment(target: number[], source: number[], offset: number = 0): number[] {
  if (target.length < offset + source.length) {
    throw new Error('Source array is too large to fit at the given offset');
  }

  for (let i = 0; i < source.length; i++) {
    target[offset + i] = source[i];
  }

  return target;
}
