export function toHex(num: number) {
    return num.toString(16).toUpperCase().padStart(2, '0');
}

export function u8ArrToHex(u8: Uint8Array) {
    return Array.from(u8).map(toHex).join(' ');
}
