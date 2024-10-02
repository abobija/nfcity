import Picc, { PiccBlock, PiccKey, PiccKeyType, PiccMemory, PiccSector, PiccState, PiccType } from "@/models/Picc";

export const defaultKey: PiccKey = {
  type: PiccKeyType.A,
  value: Uint8Array.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
};

export class MifareClassicMemory implements PiccMemory {
  public static blockSize: number = 16;
  public readonly sectors: Map<number, PiccSector>;
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

  public updateBlocks(blocks: PiccBlock[]): void {
    blocks.forEach(block => this.updateBlock(block));
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

  public updateBlock(block: PiccBlock): void {
    const sectorOffset = MifareClassicMemory.sectorOffset(block.address);
    const blockOffset = MifareClassicMemory.blockOffset(block.address, sectorOffset);

    this.sectors.get(sectorOffset)!.blocks.set(blockOffset, block);
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
