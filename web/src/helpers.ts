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

export function randomBytes(length: number) {
  return new Uint8Array(
    Array.from({ length }, () => Math.floor(Math.random() * 0xFF))
  );
}

export function nibbles(byte: number): [MSB, LSB] {
  return [byte >> 4, byte & 0x0F];
}
