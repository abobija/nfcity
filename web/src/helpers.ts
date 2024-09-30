export function toHex(num: number) {
  const hex = num.toString(16).toUpperCase();

  return hex.length % 2 ? '0' + hex : hex;
}

export function u8ToHex(u8: Uint8Array) {
  return Array.from(u8).map(toHex).join(' ');
}

export function randomBytes(length: number) {
  return new Uint8Array(
    Array.from({ length }, () => Math.floor(Math.random() * 0xFF))
  );
}
