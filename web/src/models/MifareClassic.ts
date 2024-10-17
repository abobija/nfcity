import PiccDto from "@/communication/dtos/PiccDto";
import Picc, {
  keyA,
  PiccBlock,
  PiccBlockAccessBits,
  PiccKey,
  PiccMemory,
  PiccSector,
  PiccState,
  PiccType,
  UpdatablePiccBlock,
  UpdatablePiccSector
} from "@/models/Picc";
import {
  assert,
  hash,
  invertedNibble,
  invertNibble,
  isByte,
  nibble,
  nibbles,
  nibblesToByte,
  unhexToArray
} from "@/utils/helpers";

export const keySize = 6;
export const blockSize = 16;

export const defaultKey: PiccKey = {
  type: keyA,
  value: unhexToArray('FFFFFFFFFFFF'),
};

export enum MifareClassicBlockGroupType {
  Undefined,

  // Sector trailer
  KeyA,
  AccessBits,
  UserByte,
  KeyB,

  // Value block
  Value,
  ValueInverted,
  Address,
  AddressInverted,

  // Data block
  Data,

  // Manufacturer block
  UID,
  BCC,
  SAK,
  ATQA,
  ManufacturerData,
}

export enum MifareClassicBlockType {
  Undefined,
  SectorTrailer,
  Data,
  Value,
  Manufacturer,
}

export const everyAccessBitCombo = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export type AccessBitsCombo = typeof everyAccessBitCombo[number];

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

export type MifareClassicBlockOperation =
  | 'read'
  | 'write'
  | 'increment'
  | 'decrement'
  | 'transfer'
  | 'restore';

type MifareClassicKeyPermissions = {
  readonly [key in MifareClassicBlockOperation]: {
    readonly keyA: ReadonlyArray<AccessBitsCombo>;
    readonly keyB: ReadonlyArray<AccessBitsCombo>;
  }
}

const keyAAccessConditions: Partial<MifareClassicKeyPermissions> =
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

const accessBitsAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101, 0b111],
    keyB: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101, 0b111],
  },
  write: {
    keyA: [0b001],
    keyB: [0b011, 0b101],
  },
};

const keyBAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b001],
    keyB: [0b000, 0b010, 0b001],
  },
  write: {
    keyA: [0b000, 0b001],
    keyB: [0b100, 0b011],
  },
};

const dataBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b000, 0b010, 0b100, 0b110, 0b001],
    keyB: [0b000, 0b010, 0b100, 0b110, 0b001, 0b011, 0b101],
  },
  write: {
    keyA: [0b000],
    keyB: [0b000, 0b100, 0b110, 0b011],
  }
};

const valueBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: [0b110, 0b001],
    keyB: [0b110, 0b001],
  },
  write: { // TODO:
    keyA: [],
    keyB: [],
  },
  increment: { // TODO:
    keyA: [],
    keyB: [],
  },
  decrement: { // TODO:
    keyA: [],
    keyB: [],
  },
  transfer: { // TODO:
    keyA: [],
    keyB: [],
  },
  restore: { // TODO:
    keyA: [],
    keyB: [],
  },
}

const manufacturerBlockAccessConditions: Partial<MifareClassicKeyPermissions> = {
  read: {
    keyA: Array.from(everyAccessBitCombo),
    keyB: Array.from(everyAccessBitCombo),
  },
  write: {
    keyA: [],
    keyB: [],
  }
};

type AccessBitsPool = {
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

export function accessBitsComboPoolToBytes(pool: AccessBitsComboPool): number[] {
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

export function accessBitsPoolToBytes(accessBitsPool: AccessBitsPool): number[] {
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

function isValueBlock(accessBits: PiccBlockAccessBits): boolean {
  return [0b110, 0b001].includes(calculateAccessBitsCombo(accessBits));
}

export class MifareClassicBlockGroup {
  private _block?: MifareClassicBlock;

  constructor(
    readonly type: MifareClassicBlockGroupType,
    readonly offset: number,
    readonly length: number,
    readonly accessConditions: Partial<MifareClassicKeyPermissions> = {},
  ) {
    this.type = type;
    this.offset = offset;
    this.length = length;
    this._block = undefined;
  }

  get block(): MifareClassicBlock {
    if (this._block === undefined) {
      throw new Error('Block not set');
    }

    return this._block;
  }

  set block(block: MifareClassicBlock) {
    if (this._block !== undefined) {
      throw new Error('Block already set');
    }

    this._block = block;
  }

  allowedOperationsFor(key: PiccKey): MifareClassicBlockOperation[] {
    return (Object.keys(this.accessConditions) as MifareClassicBlockOperation[]).filter(op =>
      this.accessConditions[op]
        ?.[key.type == keyA ? 'keyA' : 'keyB']
        .includes(this.block.accessBitsCombo)
    );
  }

  keyCan(key: PiccKey, operation: MifareClassicBlockOperation): boolean {
    return this.accessConditions[operation]
      ?.[key.type == keyA ? 'keyA' : 'keyB']
      ?.includes(this.block.accessBitsCombo)
      ?? false;
  }

  hasSameTypeAs(that: MifareClassicBlockGroup): boolean {
    return this.type === that.type;
  }

  isSameAs(that: MifareClassicBlockGroup): boolean {
    return this.block.hasSameAddressAs(that.block)
      && this.offset === that.offset
      && this.length === that.length;
  }

  data(): number[] {
    return this.block.data.slice(this.offset, this.offset + this.length);
  }
};

export abstract class MifareClassicBlock implements PiccBlock {
  readonly address: number;
  private _data: number[];
  readonly accessBits: PiccBlockAccessBits;
  readonly accessBitsCombo: AccessBitsCombo;
  readonly groups: MifareClassicBlockGroup[];

  get data(): number[] {
    return this._data;
  }

  protected constructor(
    readonly type: MifareClassicBlockType,
    readonly sector: MifareClassicSector,
    block: PiccBlock,
    bytesGroups: MifareClassicBlockGroup[]
  ) {
    this.type = type;
    this.sector = sector;
    this.address = block.address;
    this._data = block.data;
    this.accessBits = block.accessBits;
    this.accessBitsCombo = calculateAccessBitsCombo(this.accessBits);
    bytesGroups.forEach(group => group.block = this);
    this.groups = bytesGroups;
  }

  get loaded(): Boolean {
    return this.data.length === blockSize;
  }

  hasSameAddressAs(that: MifareClassicBlock): boolean {
    return this.address == that.address;
  }

  updateWith(block: UpdatablePiccBlock): MifareClassicBlock {
    if (this.address != block.address) {
      throw new Error('Invalid block address');
    }

    if (block.data.length != blockSize) {
      throw new Error('Invalid block data length');
    }

    this._data = block.data;

    return this;
  }

  findGroup(type: MifareClassicBlockGroupType): MifareClassicBlockGroup | undefined {
    return this.groups.find(group => group.type === type);
  }
}

class MifareClassicUndefinedBlock extends MifareClassicBlock {
  constructor(sector: MifareClassicSector, address: number) {
    super(
      MifareClassicBlockType.Undefined,
      sector,
      {
        address,
        data: [],
        accessBits: { c1: 0, c2: 0, c3: 0 },
      },
      [
        new MifareClassicBlockGroup(MifareClassicBlockGroupType.Undefined, 0, blockSize),
      ]);
  }
}

export class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  readonly accessBitsPool: AccessBitsPool;

  constructor(
    sector: MifareClassicSector,
    block: Omit<PiccBlock, 'accessBits'>,
  ) {
    const { data } = block;

    throwIfAccessBitsIntegrityViolated(data[6], data[7], data[8]);

    const [c1] = nibbles(data[7]);
    const [c3, c2] = nibbles(data[8]);

    const _accessBitsPool: AccessBitsPool = {
      3: MifareClassicSectorTrailerBlock.nibblesToAccessBits(c1, c2, c3, 3),
      2: MifareClassicSectorTrailerBlock.nibblesToAccessBits(c1, c2, c3, 2),
      1: MifareClassicSectorTrailerBlock.nibblesToAccessBits(c1, c2, c3, 1),
      0: MifareClassicSectorTrailerBlock.nibblesToAccessBits(c1, c2, c3, 0),
    };

    super(
      MifareClassicBlockType.SectorTrailer,
      sector,
      { ...block, accessBits: _accessBitsPool[3] },
      [
        new MifareClassicBlockGroup(MifareClassicBlockGroupType.KeyA, 0, 6, keyAAccessConditions),
        new MifareClassicBlockGroup(MifareClassicBlockGroupType.AccessBits, 6, 3, accessBitsAccessConditions),
        new MifareClassicBlockGroup(MifareClassicBlockGroupType.UserByte, 9, 1, accessBitsAccessConditions),
        new MifareClassicBlockGroup(MifareClassicBlockGroupType.KeyB, 10, 6, keyBAccessConditions),
      ]
    );

    this.accessBitsPool = _accessBitsPool;
  }

  keyCanWriteToAnyGroup(key: PiccKey): boolean {
    return this.groups.some(group => group.keyCan(key, 'write'));
  }

  static calculateBlockAccessBitsPoolIndex(blockOffset: number, numberOfBlocks: number): AccessBitsPoolIndex {
    let index = blockOffset;

    if (numberOfBlocks > 4) {
      index = Math.floor(blockOffset / 5);
    }

    assert(isAccessBitsPoolIndex(index));

    return index;
  }

  private static nibblesToAccessBits(c1: number, c2: number, c3: number, offset: number): PiccBlockAccessBits {
    return {
      c1: (c1 & (1 << offset)) >> offset,
      c2: (c2 & (1 << offset)) >> offset,
      c3: (c3 & (1 << offset)) >> offset,
    }
  }
}

export class MifareClassicDataBlock extends MifareClassicBlock {
  constructor(sector: MifareClassicSector, block: PiccBlock) {
    super(MifareClassicBlockType.Data, sector, block, [
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.Data, 0, blockSize, dataBlockAccessConditions),
    ]);
  }

  keyCan(key: PiccKey, operation: MifareClassicBlockOperation): boolean {
    assert(this.groups.length === 1);
    return this.groups[0].keyCan(key, operation);
  }
}

export class MifareClassicValueBlock extends MifareClassicBlock {
  constructor(sector: MifareClassicSector, block: PiccBlock) {
    // TODO: Parse

    super(MifareClassicBlockType.Value, sector, block, [
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.Value, 0, 4, valueBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.ValueInverted, 4, 4, valueBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.Value, 8, 4, valueBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.Address, 12, 1, valueBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.AddressInverted, 13, 1, valueBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.Address, 14, 1, valueBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.AddressInverted, 15, 1, valueBlockAccessConditions),
    ]);
  }
}

class MifareClassicManufacturerBlock extends MifareClassicBlock {
  constructor(sector: MifareClassicSector, block: PiccBlock) {
    const { uid } = sector.memory.picc;

    super(MifareClassicBlockType.Manufacturer, sector, block, [
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.UID, 0, uid.length, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.BCC, uid.length, 1, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.SAK, uid.length + 1, 1, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup(MifareClassicBlockGroupType.ATQA, uid.length + 2, 2, manufacturerBlockAccessConditions),
      new MifareClassicBlockGroup(
        MifareClassicBlockGroupType.ManufacturerData,
        uid.length + 4,
        blockSize - uid.length - 4,
        manufacturerBlockAccessConditions
      ),
    ]);
  }
}

export class MifareClassicSector implements PiccSector {
  private _key?: PiccKey;
  private _offset?: number;

  constructor(
    readonly memory: MifareClassicMemory,
    readonly blocks: MifareClassicBlock[]
  ) {
    this.memory = memory;
    this.blocks = blocks;
  }

  get key(): PiccKey | undefined {
    return this._key;
  }

  get offset() {
    return this._offset ?? (this._offset = this.memory.offsetOfSector(this));
  }

  get block0Address() {
    return this.blockAtOffset(0).address;
  }

  get numberOfBlocks() {
    return this.blocks.length;
  }

  // returns true if none of the blocks in the sector are loaded
  get isEmpty() {
    return Array.from(this.blocks.values()).every(block => !block.loaded);
  }

  get trailerOffset() {
    return this.numberOfBlocks - 1;
  }

  private blockAtOffset(offset: number): MifareClassicBlock {
    return this.blocks.at(offset)!; // FIXME: !
  }

  private accessPoolIndexOfBlockAtOffset(blockOffset: number) {
    return MifareClassicSectorTrailerBlock.calculateBlockAccessBitsPoolIndex(
      blockOffset,
      this.numberOfBlocks
    );
  }

  authenticate(key: PiccKey): void {
    this._key = key;
  }

  deauthenticate(): void {
    this._key = undefined;

    for (let i = this.numberOfBlocks - 1; i >= 0; i--) {
      this.blocks[i] = new MifareClassicUndefinedBlock(this, this.blocks[i].address);
    }
  }

  updateWith(sector: UpdatablePiccSector): void {
    if (sector.blocks.length != this.numberOfBlocks) {
      throw new Error('Invalid number of blocks');
    }

    const trailer = new MifareClassicSectorTrailerBlock(this,
      sector.blocks.at(-1)! // FIXME: !
    );

    this.blocks[this.trailerOffset] = trailer;

    sector.blocks.slice(0, -1)
      .forEach((block, offset) => {
        const accessPoolIndex = this.accessPoolIndexOfBlockAtOffset(offset);
        const accessBits = trailer.accessBitsPool[accessPoolIndex];

        if (block.address === 0) {
          this.blocks[offset] = new MifareClassicManufacturerBlock(this, { ...block, accessBits });
          return;
        }

        if (isValueBlock(accessBits)) {
          this.blocks[offset] = new MifareClassicValueBlock(this, { ...block, accessBits });
          return;
        }

        this.blocks[offset] = new MifareClassicDataBlock(this, { ...block, accessBits });
      });

    this.authenticate(sector.key);
  }
}

export class MifareClassicMemory implements PiccMemory {
  readonly sectors: MifareClassicSector[];
  readonly numberOfSectors: number;
  readonly blockDistribution: Array<[number, number]>;
  readonly size: number;

  constructor(readonly picc: MifareClassic, piccType: PiccType) {
    this.picc = picc;
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    // Initialize sectors
    this.sectors = [];

    let blockAddress = 0;
    for (let sectorOffset = 0; sectorOffset < this.numberOfSectors; sectorOffset++) {
      const sector = new MifareClassicSector(this, []);
      const numberOfBlocks = MifareClassicMemory.numberOfBlocksInSector(sectorOffset);

      for (let blockOffset = 0; blockOffset < numberOfBlocks; blockOffset++) {
        sector.blocks.push(new MifareClassicUndefinedBlock(sector, blockAddress++));
      }

      this.sectors.push(sector);
    }

    if (this.numberOfSectors < 16) {
      this.blockDistribution = [[5, 4]];
    }
    else if (this.numberOfSectors < 32) {
      this.blockDistribution = [[16, 4]];
    }
    else {
      this.blockDistribution = [[32, 4], [16, 8]];
    }

    this.size = this.blockDistribution.reduce((acc, [n, m]) => acc + n * m, 0) * blockSize;
  }

  get isEmpty() {
    return this.sectors.every(sector => sector.isEmpty);
  }

  sectorAtOffset(offset: number): MifareClassicSector {
    return this.sectors.at(offset)!; // FIXME: !
  }

  offsetOfSector(sector: MifareClassicSector): number {
    return this.sectors.indexOf(sector);
  }

  blockAtAddress(address: number): MifareClassicBlock | undefined {
    for (const sector of this.sectors) {
      for (const block of sector.blocks) {
        if (block.address === address) {
          return block;
        }
      }
    }

    return undefined;
  }

  private static numberOfBlocksInSector(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  private static numberOfSectors(type: PiccType): number {
    switch (type) {
      case PiccType.Mifare1K:
        return 16;
      case PiccType.Mifare4K:
        return 40;
      case PiccType.MifareMini:
        return 5;
      default:
        throw new Error("Unsupported Mifare type");
    }
  }

  private static sectorOffsetFromBlockAddress(blockAddress: number): number {
    let offset = 0;

    if (blockAddress < 128) {
      offset = Math.floor(blockAddress / 4);
    }

    offset = 32 + Math.floor((blockAddress - 128) / 16);

    assert(isByte(offset));

    return offset;
  }

  private static sectorBlock0Address(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return sectorOffset * 4;
    }

    return 128 + (sectorOffset - 32) * 16;
  }

  static blockAtAddressIsSectorTrailer(blockAddress: number): boolean {
    const sectorOffset = MifareClassicMemory.sectorOffsetFromBlockAddress(blockAddress);
    const numberOfBlocks = MifareClassicMemory.numberOfBlocksInSector(sectorOffset);
    const block0Address = MifareClassicMemory.sectorBlock0Address(sectorOffset);

    return blockAddress === block0Address + numberOfBlocks - 1;
  }
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
