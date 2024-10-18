import PiccDto from "@/communication/dtos/PiccDto";
import Picc, {
  keyA,
  KeyType,
  PiccBlockAccessBits,
  PiccKey,
  PiccState,
  PiccType
} from "@/models/Picc";
import {
  assert,
  hash,
  invertedNibble,
  invertNibble,
  nibble,
  nibbles,
  nibblesToByte,
  unhexToArray
} from "@/utils/helpers";
import MifareClassicMemory from "./MifareClassicMemory";

export const keySize = 6;
export const blockSize = 16;

export const defaultKey: PiccKey = {
  type: keyA,
  value: unhexToArray('FFFFFFFFFFFF'),
};

export enum MifareClassicBlockType {
  Undefined,
  SectorTrailer,
  Data,
  Value,
  Manufacturer,
}

export const undefinedBlockGroupNames = ['Undefined'] as const;
export const sectorTrailerBlockGroupNames = ['KeyA', 'AccessBits', 'UserByte', 'KeyB'] as const;
export const dataBlockGroupNames = ['Data'] as const;
export const valueBlockGroupNames = ['Value', 'ValueInverted', 'Address', 'AddressInverted'] as const;
export const manufacturerBlockGroupNames = ['UID', 'BCC', 'SAK', 'ATQA', 'ManufacturerData'] as const;

export type UndefinedBlockGroupType = typeof undefinedBlockGroupNames[number];
export type SectorTrailerBlockGroupType = typeof sectorTrailerBlockGroupNames[number];
export type DataBlockGroupType = typeof dataBlockGroupNames[number];
export type ValueBlockGroupType = typeof valueBlockGroupNames[number];
export type ManufacturerBlockGroupType = typeof manufacturerBlockGroupNames[number];

export type MifareClassicBlockGroupType =
  | UndefinedBlockGroupType
  | SectorTrailerBlockGroupType
  | DataBlockGroupType
  | ValueBlockGroupType
  | ManufacturerBlockGroupType;

export type AccessBitsBytes = [byte6: number, byte7: number, byte8: number];

export const everyAccessBitCombo = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export type AccessBitsCombo = typeof everyAccessBitCombo[number];

export const sectorTrailerCombos: AccessBitsCombo[] = [
  0b000,
  0b010,
  0b100,
  0b110,
  0b001,
  0b011,
  0b101,
  0b111,
];

export const dataBlockCombos: AccessBitsCombo[] = [
  0b000,
  0b010,
  0b100,
  0b110,
  0b001,
  0b011,
  0b101,
  0b111,
];

export const sectorTrailerDefaultCombo: AccessBitsCombo = 0b001;
export const dataBlockDefaultCombo: AccessBitsCombo = 0b000;

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

export type AccessBitsPoolIndex = 3 | 2 | 1 | 0;

const blockOperationNames = ['read', 'write', 'increment', 'decrement', 'transfer', 'restore'] as const;

export type MifareClassicBlockOperation = typeof blockOperationNames[number];

export function operationShortName(operation: MifareClassicBlockOperation): string {
  switch (operation) {
    case 'restore':
      return operation.charAt(0).toUpperCase();
    default:
      return operation.charAt(0);
  }
}

export type MifareClassicKeyPermissions = {
  readonly [key in MifareClassicBlockOperation]: {
    readonly keyA: ReadonlyArray<AccessBitsCombo>;
    readonly keyB: ReadonlyArray<AccessBitsCombo>;
  }
}

export const keyAAccessConditions: Partial<MifareClassicKeyPermissions> =
{
  read: {
    keyA: [],
    keyB: [],
  },
  write: {
    keyA: [0b000, 0b001],
    keyB: [0b100, 0b011],
  },
};

export const accessBitsAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101, 0b111],
    keyB: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101, 0b111],
  },
  write: {
    keyA: [0b001],
    keyB: [0b011, 0b101],
  },
};

export const keyBAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b001],
    keyB: [0b000, 0b010, 0b001],
  },
  write: {
    keyA: [0b000, 0b001],
    keyB: [0b100, 0b011],
  },
};

export const sectorTrailerAccessConditions: Map<SectorTrailerBlockGroupType, Partial<MifareClassicKeyPermissions>> = new Map([
  ['KeyA', keyAAccessConditions],
  ['AccessBits', accessBitsAccessConditions],
  ['UserByte', accessBitsAccessConditions],
  ['KeyB', keyBAccessConditions],
]);

export const dataBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b100, 0b110, 0b001],
    keyB: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101],
  },
  write: {
    keyA: [0b000],
    keyB: [0b000, 0b100, 0b110, 0b011],
  }
};

export const valueBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  write: {
    keyA: [],
    keyB: [0b110],
  },
  increment: {
    keyA: [],
    keyB: [0b110],
  },
  decrement: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  transfer: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  restore: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
}

export const manufacturerBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: Array.from(everyAccessBitCombo),
    keyB: Array.from(everyAccessBitCombo),
  },
  write: {
    keyA: [],
    keyB: [],
  }
};

function operations(accessConditions: Partial<MifareClassicKeyPermissions>) {
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

export type AccessBitsPool = {
  readonly [key in AccessBitsPoolIndex]: Readonly<PiccBlockAccessBits>;
}

export type AccessBitsComboPool = {
  readonly [key in AccessBitsPoolIndex]: Readonly<AccessBitsCombo>;
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

export function isValueBlock(accessBits: PiccBlockAccessBits): boolean {
  return [0b110, 0b001].includes(calculateAccessBitsCombo(accessBits));
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

export default class MifareClassic implements Picc {
  private _hash: string;
  readonly memory: MifareClassicMemory;

  protected constructor(
    readonly type: PiccType,
    readonly atqa: number,
    readonly sak: number,
    readonly uid: number[],
    private _state: PiccState,
  ) {
    this._hash = MifareClassic.calculateHash(this);
    this.memory = new MifareClassicMemory(this, type);
  }

  get hash(): string {
    return this._hash;
  };

  get state(): PiccState {
    return this._state;
  }

  set state(state: PiccState) {
    this._state = state;
  }

  static fromDto(piccDto: PiccDto): MifareClassic {
    return new MifareClassic(
      piccDto.type,
      piccDto.atqa,
      piccDto.sak,
      Array.from(piccDto.uid),
      piccDto.state,
    );
  }

  static calculateHash(picc: Picc | PiccDto): string {
    return hash([
      picc.type,
      picc.atqa,
      picc.sak,
      ...picc.uid,
    ]);
  }

  static isMifareClassic(picc: Picc | PiccDto): boolean {
    return picc.type === PiccType.Mifare1K
      || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}

class AccessBitsIntegrityViolationError extends Error {
  constructor() {
    super('Access bits integrity violated');
  }
}
