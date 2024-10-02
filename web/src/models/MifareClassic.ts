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

export abstract class MifareClassicBlock implements PiccBlock {
  address: number;
  offset: number;
  data: Uint8Array;
  accessBits: AccessBits;

  protected constructor(block: PiccBlockDto, accessBits: AccessBits) {
    this.address = block.address;
    this.offset = block.offset;
    this.data = block.data;
    this.accessBits = accessBits;
  }
}

export class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  public readonly accessBitsPool: Array<AccessBits>;

  constructor(block: PiccBlockDto, accessBitsPool: Array<AccessBits>) {
    if (accessBitsPool.length != 4) {
      throw new Error('Invalid access bits pool');
    }

    super(block, accessBitsPool[3]);
    this.accessBitsPool = accessBitsPool;
  }

  public static from(block: PiccBlockDto) {
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

    return new MifareClassicSectorTrailerBlock(block, accessBitsPool);
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
  public static from(block: PiccBlockDto, accessBits: AccessBits) {
    return new MifareClassicDataBlock(block, accessBits);
  }
}

export class MifareClassicValueBlock extends MifareClassicBlock {
  public static isValueBlock(accessBits: AccessBits): Boolean {
    const bits = (accessBits.c1 << 2) | (accessBits.c2 << 1) | (accessBits.c3 << 0);

    return bits == 0b110 || bits == 0b001;
  }

  public static from(block: PiccBlockDto, accessBits: AccessBits) {
    // TODO: Parse

    return new MifareClassicValueBlock(block, accessBits);
  }
}

export class MifareClassicManufacturerBlock extends MifareClassicBlock {
  public static from(block: PiccBlockDto, accessBits: AccessBits) {
    return new MifareClassicManufacturerBlock(block, accessBits);
  }
}

class MifareClassicSector implements PiccSector {
  offset: number;
  blocks: Map<number, MifareClassicBlock>;

  protected constructor(offset: number) {
    this.offset = offset;
    this.blocks = new Map();
  }

  public static from(offset: number) {
    return new MifareClassicSector(offset);
  }
}

export class MifareClassicMemory implements PiccMemory {
  public static blockSize: number = 16;
  public readonly sectors: Map<number, MifareClassicSector>;
  public readonly numberOfSectors: number;

  protected constructor(piccType: PiccType) {
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    this.sectors = new Map(
      Array.from({ length: this.numberOfSectors }).map((_, i) => [i, {
        offset: i,
        blocks: new Map(),
      }])
    );
  }

  public static from(piccType: PiccType) {
    return new MifareClassicMemory(piccType);
  }

  private updateBlock(block: PiccBlockDto): void {
    const sectorOffset = MifareClassicMemory.sectorOffset(block.address);
    const numberOfBlocks = MifareClassicMemory.numberOfBlocks(sectorOffset);

    if (block.offset == numberOfBlocks - 1) {
      this.sectors.get(sectorOffset)!.blocks.set(block.offset, MifareClassicSectorTrailerBlock.from(block));
      return;
    }

    const trailer = this.sectors.get(sectorOffset)!.blocks.get(numberOfBlocks - 1);

    if (trailer === undefined || !(trailer instanceof MifareClassicSectorTrailerBlock)) {
      throw new Error('Trailer block not found');
    }

    const accessPoolIndex = MifareClassicSectorTrailerBlock.calculateBlockAccessBitsPoolIndex(block.offset, numberOfBlocks);
    const accessBits = trailer.accessBitsPool[accessPoolIndex];

    if (block.address == 0) {
      this.sectors.get(sectorOffset)!.blocks.set(block.offset, MifareClassicManufacturerBlock.from(block, accessBits));
      return;
    }

    if (MifareClassicValueBlock.isValueBlock(accessBits)) {
      this.sectors.get(sectorOffset)!.blocks.set(block.offset, MifareClassicValueBlock.from(block, accessBits));
      return
    }

    this.sectors.get(sectorOffset)!.blocks.set(block.offset, MifareClassicDataBlock.from(block, accessBits));
  }

  public updateSector(blocks: PiccBlockDto[]): void {
    if (blocks.length < 4) {
      throw new Error('Invalid number of blocks');
    }

    blocks
      .sort((a, b) => b.address - a.address) // Sort so that trailer block is first
      .forEach(block => this.updateBlock(block));
  }

  public static numberOfBlocks(sectorOffset: number): number {
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
    this.memory = MifareClassicMemory.from(picc.type);
  }

  public static from(picc: Picc): MifareClassic {
    return new MifareClassic(picc);
  }

  public static isMifareClassic(picc: Picc): picc is MifareClassic {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}
