import { assert, isByte } from "@/utils/helpers";
import { PiccMemory, PiccType } from "../Picc";
import MifareClassic, { blockSize } from "./MifareClassic";
import MifareClassicBlock from "./MifareClassicBlock";
import MifareClassicSector from "./MifareClassicSector";
import MifareClassicUndefinedBlock from "./blocks/MifareClassicUndefinedBlock";

export default class MifareClassicMemory implements PiccMemory {
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
