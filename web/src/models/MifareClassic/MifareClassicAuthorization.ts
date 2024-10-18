import { blockSize } from "@/models/MifareClassic/MifareClassic";
import { keyA, KeyType, PiccBlockAccessBits, PiccKey } from "@/models/Picc";
import { assert, invertedNibble, invertNibble, nibble, nibbles, nibblesToByte, unhexToArray } from "@/utils/helpers";

export const keySize = 6;

export const defaultKey: PiccKey = {
  type: keyA,
  value: unhexToArray('FFFFFFFFFFFF'),
};

export type AccessBitsBytes = [byte6: number, byte7: number, byte8: number];

export const accessBitCombos = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export type AccessBitsCombo = typeof accessBitCombos[number];

export type AccessBitsPoolIndex = 3 | 2 | 1 | 0;

const blockOperationNames = ['read', 'write', 'increment', 'decrement', 'transfer', 'restore'] as const;

export type MifareClassicBlockOperation = typeof blockOperationNames[number];

export type MifareClassicKeyPermissions = {
  readonly [key in MifareClassicBlockOperation]: {
    readonly keyA: ReadonlyArray<AccessBitsCombo>;
    readonly keyB: ReadonlyArray<AccessBitsCombo>;
  }
}

export type AccessBitsPool = {
  readonly [key in AccessBitsPoolIndex]: Readonly<PiccBlockAccessBits>;
}

export type AccessBitsComboPool = {
  readonly [key in AccessBitsPoolIndex]: Readonly<AccessBitsCombo>;
}

export class AccessBitsIntegrityViolationError extends Error {
  constructor() {
    super('Access bits integrity violated');
  }
}

export function calculateAccessBitsCombo(accessBits: PiccBlockAccessBits): AccessBitsCombo {
  return ((
    (accessBits.c1 << 2)
    | (accessBits.c2 << 1)
    | (accessBits.c3 << 0)
  ) & 0b111) as AccessBitsCombo;
}

export function calculateAccessBitsFromCombo(combo: AccessBitsCombo): PiccBlockAccessBits {
  return {
    c1: (combo >> 2) & 1,
    c2: (combo >> 1) & 1,
    c3: (combo >> 0) & 1,
  };
}

export function operationShortName(operation: MifareClassicBlockOperation): string {
  switch (operation) {
    case 'restore':
      return operation.charAt(0).toUpperCase();
    default:
      return operation.charAt(0);
  }
}

export function operations(accessConditions: Partial<MifareClassicKeyPermissions>) {
  return Object.keys(accessConditions) as MifareClassicBlockOperation[];
}


export function keyTypeCan(
  keyType: KeyType,
  operation: MifareClassicBlockOperation,
  accessConditions: Partial<MifareClassicKeyPermissions>,
  accessBitsCombo: AccessBitsCombo
): boolean {
  return accessConditions[operation]
    ?.[keyType == keyA ? 'keyA' : 'keyB']
    ?.includes(accessBitsCombo)
    ?? false;
}


export function keyTypePermissions(
  keyType: KeyType,
  accessConditions: Partial<MifareClassicKeyPermissions>,
  accessBitsCombo: AccessBitsCombo,
): { operation: MifareClassicBlockOperation, allowed: boolean }[] {
  return operations(accessConditions).map(operation => {
    return {
      operation,
      allowed: keyTypeCan(keyType, operation, accessConditions, accessBitsCombo),
    };
  });
}

export function allowedOperationsForKeyType(
  keyType: KeyType,
  accessConditions: Partial<MifareClassicKeyPermissions>,
  accessBitsCombo: AccessBitsCombo
): MifareClassicBlockOperation[] {
  return keyTypePermissions(keyType, accessConditions, accessBitsCombo)
    .filter(({ allowed }) => allowed)
    .map(({ operation }) => operation);
}

export function isAccessBitsPoolIndex(index: number): index is AccessBitsPoolIndex {
  return index >= 0 && index <= 3;
}

export function accessBitsComboPoolToBitsPool(pool: AccessBitsComboPool): AccessBitsPool {
  return {
    3: calculateAccessBitsFromCombo(pool[3]),
    2: calculateAccessBitsFromCombo(pool[2]),
    1: calculateAccessBitsFromCombo(pool[1]),
    0: calculateAccessBitsFromCombo(pool[0]),
  };
}

export function accessBitsComboPoolToBytes(pool: AccessBitsComboPool): AccessBitsBytes {
  return accessBitsPoolToBytes(accessBitsComboPoolToBitsPool(pool));
}

/*
 * +-----+------+------+------+------+------+------+------+------+
 * |     |   7  |   6  |   5  |   4  |   3  |   2  |   1  |   0  |
 * +-----+------+------+------+------+------+------+------+------+
 * | [6] | ~C23 | ~C22 | ~C21 | ~C20 | ~C13 | ~C12 | ~C11 | ~C10 |
 * +-----+------+------+------+------+------+------+------+------+
 * | [7] |  C13 |  C12 |  C11 |  C10 | ~C33 | ~C32 | ~C31 | ~C30 |
 * +-----+------+------+------+------+------+------+------+------+
 * | [8] |  C33 |  C32 |  C31 |  C30 |  C23 |  C22 |  C21 |  C20 |
 * +-----+------+------+------+------+------+------+------+------+
 */

export function accessBitsPoolToBytes(accessBitsPool: AccessBitsPool): AccessBitsBytes {
  const byte6 = nibblesToByte(
    invertedNibble(accessBitsPool[3].c2, accessBitsPool[2].c2, accessBitsPool[1].c2, accessBitsPool[0].c2),
    invertedNibble(accessBitsPool[3].c1, accessBitsPool[2].c1, accessBitsPool[1].c1, accessBitsPool[0].c1)
  );

  const byte7 = nibblesToByte(
    nibble(accessBitsPool[3].c1, accessBitsPool[2].c1, accessBitsPool[1].c1, accessBitsPool[0].c1),
    invertedNibble(accessBitsPool[3].c3, accessBitsPool[2].c3, accessBitsPool[1].c3, accessBitsPool[0].c3)
  );

  const byte8 = nibblesToByte(
    nibble(accessBitsPool[3].c3, accessBitsPool[2].c3, accessBitsPool[1].c3, accessBitsPool[0].c3),
    nibble(accessBitsPool[3].c2, accessBitsPool[2].c2, accessBitsPool[1].c2, accessBitsPool[0].c2)
  );

  throwIfAccessBitsIntegrityViolated(byte6, byte7, byte8);

  return [byte6, byte7, byte8];
}

/**
 * bytes 6, 7, 8 of the sector trailer block
 */
function isAccessBitsIntegrityViolated(byte6: number, byte7: number, byte8: number): boolean {
  const [c2_, c1_] = nibbles(byte6);
  const [c1, c3_] = nibbles(byte7);
  const [c3, c2] = nibbles(byte8);

  return c1_ !== invertNibble(c1) || c2_ !== invertNibble(c2) || c3_ !== invertNibble(c3);
}

export function throwIfAccessBitsIntegrityViolated(byte6: number, byte7: number, byte8: number): void {
  if (isAccessBitsIntegrityViolated(byte6, byte7, byte8)) {
    throw new AccessBitsIntegrityViolationError();
  }
}

export function accessBitsNibblesToAccessBits(
  c1: number, c2: number, c3: number, offset: number
): PiccBlockAccessBits {
  return {
    c1: (c1 & (1 << offset)) >> offset,
    c2: (c2 & (1 << offset)) >> offset,
    c3: (c3 & (1 << offset)) >> offset,
  }
}

export function accessBitsPoolFromSectorTrailerData(data: number[]): AccessBitsPool {
  assert(data.length === blockSize);
  throwIfAccessBitsIntegrityViolated(data[6], data[7], data[8]);

  const [c1] = nibbles(data[7]);
  const [c3, c2] = nibbles(data[8]);

  return {
    3: accessBitsNibblesToAccessBits(c1, c2, c3, 3),
    2: accessBitsNibblesToAccessBits(c1, c2, c3, 2),
    1: accessBitsNibblesToAccessBits(c1, c2, c3, 1),
    0: accessBitsNibblesToAccessBits(c1, c2, c3, 0),
  };
}
