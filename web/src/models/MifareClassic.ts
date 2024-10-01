import Picc, { PiccBlock, PiccMemory, PiccSector, PiccState, PiccType } from "./Picc";

class MifareClassicMemory implements PiccMemory {
  public readonly sectors: Map<number, PiccSector>;
  public readonly numberOfSectors: number;

  constructor(piccType: PiccType) {
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    this.sectors = new Map(
      Array.from({ length: this.numberOfSectors })
        .map((_, i) => [i, { blocks: new Map() }])
    );
  }

  get blockSize(): number {
    return 16;
  }

  public numberOfBlocks(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  public sectorOffset(blockAddress: number): number {
    if (blockAddress < 128) {
      return Math.floor(blockAddress / 4);
    }

    return 32 + Math.floor((blockAddress - 128) / 16);
  }

  public sectorBlock0Address(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return sectorOffset * 4;
    }

    return 128 + (sectorOffset - 32) * 16;
  }

  public blockOffset(blockAddress: number, sectorOffset: number): number {
    return blockAddress - this.sectorBlock0Address(sectorOffset);
  }

  public setBlock(blockAddress: number, block: PiccBlock): void {
    const sectorOffset = this.sectorOffset(blockAddress);
    const blockOffset = this.blockOffset(blockAddress, sectorOffset);

    this.sectors.get(sectorOffset)!.blocks.set(blockOffset, block);
  }

  public setBlockData(blockAddress: number, data: Uint8Array): void {
    this.setBlock(blockAddress, { bytes: data });
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
    this.memory = new MifareClassicMemory(picc.type);
  }

  public static from(picc: Picc): MifareClassic {
    return new MifareClassic(picc);
  }

  public static isMifareClassic(picc: Picc): picc is MifareClassic {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}
