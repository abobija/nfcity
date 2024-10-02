import PiccBlockDto from "@/comm/dtos/PiccBlockDto";
import { nibbles } from "@/helpers";
import Picc, { PiccBlock, PiccKey, PiccKeyType, PiccMemory, PiccSector, PiccState, PiccType } from "@/models/Picc";

export const defaultKey: PiccKey = {
  type: PiccKeyType.A,
  value: Uint8Array.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
};

interface AccessBits {
  c1: number;
  c2: number;
  c3: number;
}

export enum MifareClassicBlockByteGroupClass {
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

export interface MifareClassicBlockByteGroup {
  offset: number;
  length?: number;
  class: MifareClassicBlockByteGroupClass;
}

export abstract class MifareClassicBlock implements PiccBlock {
  public static readonly size: number = 16;

  public readonly sector: MifareClassicSector;
  public readonly address: number;
  public readonly offset: number;
  public readonly data: Uint8Array;
  public readonly accessBits: AccessBits;

  protected constructor(sector: MifareClassicSector, block: PiccBlockDto, accessBits: AccessBits) {
    this.sector = sector;
    this.address = block.address;
    this.offset = block.offset;
    this.data = block.data;
    this.accessBits = accessBits;
  }

  abstract get byteGroups(): Array<MifareClassicBlockByteGroup>;
}

export class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  public readonly accessBitsPool: Array<AccessBits>;

  constructor(sector: MifareClassicSector, block: PiccBlockDto, accessBitsPool: Array<AccessBits>) {
    if (accessBitsPool.length != 4) {
      throw new Error('Invalid access bits pool');
    }

    super(sector, block, accessBitsPool[3]);
    this.accessBitsPool = accessBitsPool;
  }

  public static from(sector: MifareClassicSector, block: PiccBlockDto) {
    const { data } = block;

    if (MifareClassicSectorTrailerBlock.checkAccessBitsIntegrityViolation(data)) {
      throw new Error('Access bits integrity violation');
    }

    const [c1] = nibbles(data[7]);
    const [c3, c2] = nibbles(data[8])

    const accessBitsPool = Array<AccessBits>(4);

    for (let i = 0; i < 4; i++) {
      accessBitsPool[i] = this.nibblesToAccessBits(c1, c2, c3, i);
    }

    return new MifareClassicSectorTrailerBlock(sector, block, accessBitsPool);
  }

  get byteGroups(): Array<MifareClassicBlockByteGroup> {
    return [
      { offset: 0, length: 6, class: MifareClassicBlockByteGroupClass.KeyA },
      { offset: 6, length: 3, class: MifareClassicBlockByteGroupClass.AccessBits },
      { offset: 9, length: 1, class: MifareClassicBlockByteGroupClass.UserByte },
      { offset: 10, length: 6, class: MifareClassicBlockByteGroupClass.KeyB },
    ];
  }

  public static calculateBlockAccessBitsPoolIndex(blockOffset: number, numberOfBlocks: number): number {
    if (numberOfBlocks > 4) {
      return Math.floor(blockOffset / 5);
    }

    return blockOffset;
  }

  private static nibblesToAccessBits(c1: number, c2: number, c3: number, offset: number): AccessBits {
    return {
      c1: (c1 & (1 << offset)) >> offset,
      c2: (c2 & (1 << offset)) >> offset,
      c3: (c3 & (1 << offset)) >> offset,
    }
  }

  private static checkAccessBitsIntegrityViolation(trailerData: Uint8Array): Boolean {
    const [c2_, c1_] = nibbles(trailerData[6]);
    const [c1, c3_] = nibbles(trailerData[7]);
    const [c3, c2] = nibbles(trailerData[8]);

    return (c1 != (~c1_ & 0x0F)) || (c2 != (~c2_ & 0x0F)) || (c3 != (~c3_ & 0x0F));
  }
}

export class MifareClassicDataBlock extends MifareClassicBlock {
  public static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: AccessBits) {
    return new MifareClassicDataBlock(sector, block, accessBits);
  }

  get byteGroups(): Array<MifareClassicBlockByteGroup> {
    return [
      { offset: 0, length: MifareClassicBlock.size, class: MifareClassicBlockByteGroupClass.Data },
    ];
  }
}

export class MifareClassicValueBlock extends MifareClassicBlock {
  public static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: AccessBits) {
    // TODO: Parse

    return new MifareClassicValueBlock(sector, block, accessBits);
  }

  get byteGroups(): Array<MifareClassicBlockByteGroup> {
    return [
      { offset: 0, length: 4, class: MifareClassicBlockByteGroupClass.Value },
      { offset: 4, length: 4, class: MifareClassicBlockByteGroupClass.ValueInverted },
      { offset: 8, length: 4, class: MifareClassicBlockByteGroupClass.Value },
      { offset: 12, length: 1, class: MifareClassicBlockByteGroupClass.Address },
      { offset: 13, length: 1, class: MifareClassicBlockByteGroupClass.AddressInverted },
      { offset: 14, length: 1, class: MifareClassicBlockByteGroupClass.Address },
      { offset: 15, length: 1, class: MifareClassicBlockByteGroupClass.AddressInverted },
    ];
  }

  public static isValueBlock(accessBits: AccessBits): Boolean {
    const bits = (accessBits.c1 << 2) | (accessBits.c2 << 1) | (accessBits.c3 << 0);

    return bits == 0b110 || bits == 0b001;
  }
}

export class MifareClassicManufacturerBlock extends MifareClassicBlock {
  public static from(sector: MifareClassicSector, block: PiccBlockDto, accessBits: AccessBits) {
    return new MifareClassicManufacturerBlock(sector, block, accessBits);
  }

  get byteGroups(): Array<MifareClassicBlockByteGroup> {
    const { uid } = this.sector.memory.picc;

    return [
      { offset: 0, length: uid.length, class: MifareClassicBlockByteGroupClass.UID },
      { offset: uid.length, length: 1, class: MifareClassicBlockByteGroupClass.BCC },
      { offset: uid.length + 1, length: 1, class: MifareClassicBlockByteGroupClass.SAK },
      { offset: uid.length + 2, length: 2, class: MifareClassicBlockByteGroupClass.ATQA },
      { offset: uid.length + 4, class: MifareClassicBlockByteGroupClass.ManufacturerData },
    ];
  }
}

export class MifareClassicSector implements PiccSector {
  public readonly memory: MifareClassicMemory;
  public readonly offset: number;
  public readonly blocks: Map<number, MifareClassicBlock>;

  protected constructor(memory: MifareClassicMemory, offset: number) {
    this.memory = memory;
    this.offset = offset;
    this.blocks = new Map();
  }

  public static from(memory: MifareClassicMemory, offset: number) {
    return new MifareClassicSector(memory, offset);
  }

  get isEmpty() {
    return this.blocks.size == 0;
  }

  public blockAt(blockOffset: number): MifareClassicBlock | undefined {
    return this.blocks.get(blockOffset);
  }
}

export class MifareClassicMemory implements PiccMemory {
  public readonly picc: MifareClassic;
  public readonly sectors: Map<number, MifareClassicSector>;
  public readonly numberOfSectors: number;
  public readonly blockDistribution: Array<[number, number]>;
  public readonly size: number;
  private _updateBlockCounter: number = 0;
  private _updateSectorCounter: number = 0;

  protected constructor(picc: MifareClassic, piccType: PiccType) {
    this.picc = picc;
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    this.sectors = new Map(
      Array.from({ length: this.numberOfSectors })
        .map((_, sectorOffset) => [sectorOffset, MifareClassicSector.from(this, sectorOffset)])
    );

    if (this.numberOfSectors < 16) {
      this.blockDistribution = [[5, 4]];
    }
    else if (this.numberOfSectors < 32) {
      this.blockDistribution = [[16, 4]];
    }
    else {
      this.blockDistribution = [[32, 4], [16, 8]];
    }

    this.size = this.blockDistribution.reduce((acc, [n, m]) => acc + n * m, 0) * MifareClassicBlock.size;
  }

  public static from(picc: MifareClassic, piccType: PiccType) {
    return new MifareClassicMemory(picc, piccType);
  }

  get isEmpty() {
    return this._updateBlockCounter <= 0;
  }

  get updateSectorCounter() {
    return this._updateSectorCounter;
  }

  public sectorAt(sectorOffset: number): MifareClassicSector {
    return this.sectors.get(sectorOffset)!;
  }

  private updateBlock(block: PiccBlockDto): void {
    const sectorOffset = MifareClassicMemory.sectorOffset(block.address);
    const sector = this.sectorAt(sectorOffset);
    const numberOfBlocks = MifareClassicMemory.numberOfBlocksInSector(sectorOffset);

    if (block.offset == numberOfBlocks - 1) {
      sector.blocks.set(block.offset, MifareClassicSectorTrailerBlock.from(sector, block));
      return;
    }

    const trailer = sector.blocks.get(numberOfBlocks - 1);

    if (trailer === undefined || !(trailer instanceof MifareClassicSectorTrailerBlock)) {
      throw new Error('Trailer block not found');
    }

    const accessPoolIndex = MifareClassicSectorTrailerBlock.calculateBlockAccessBitsPoolIndex(block.offset, numberOfBlocks);
    const accessBits = trailer.accessBitsPool[accessPoolIndex];

    if (block.address == 0) {
      sector.blocks.set(block.offset, MifareClassicManufacturerBlock.from(sector, block, accessBits));
      return;
    }

    if (MifareClassicValueBlock.isValueBlock(accessBits)) {
      sector.blocks.set(block.offset, MifareClassicValueBlock.from(sector, block, accessBits));
      return
    }

    sector.blocks.set(block.offset, MifareClassicDataBlock.from(sector, block, accessBits));

    this._updateBlockCounter++;
  }

  public updateSector(blocks: PiccBlockDto[]): void {
    if (blocks.length < 4) {
      throw new Error('Invalid number of blocks');
    }

    blocks
      .sort((a, b) => b.address - a.address) // Sort so that trailer block is first
      .forEach(block => this.updateBlock(block));

    this._updateSectorCounter++;
  }

  public static numberOfBlocksInSector(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  public static sectorOffset(blockAddress: number): number {
    if (blockAddress < 128) {
      return Math.floor(blockAddress / 4);
    }

    return 32 + Math.floor((blockAddress - 128) / 16);
  }

  public static sectorBlock0Address(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return sectorOffset * 4;
    }

    return 128 + (sectorOffset - 32) * 16;
  }

  public static blockOffset(blockAddress: number, sectorOffset: number): number {
    return blockAddress - MifareClassicMemory.sectorBlock0Address(sectorOffset);
  }

  public static numberOfSectors(type: PiccType): number {
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
}

export default class MifareClassic implements Picc {
  public readonly type: PiccType;
  public readonly state: PiccState;
  public readonly atqa: number;
  public readonly sak: number;
  public readonly uid: Uint8Array;
  public readonly memory: MifareClassicMemory;

  protected constructor(picc: Picc) {
    this.type = picc.type;
    this.state = picc.state;
    this.atqa = picc.atqa;
    this.sak = picc.sak;
    this.uid = picc.uid;
    this.memory = MifareClassicMemory.from(this, picc.type);
  }

  public static from(picc: Picc): MifareClassic {
    return new MifareClassic(picc);
  }

  public static isMifareClassic(picc: Picc): picc is MifareClassic {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}
