import MifareClassicDataBlock from "@/models/MifareClassic/blocks/MifareClassicDataBlock";
import { MifareClassicManufacturerBlock } from "@/models/MifareClassic/blocks/MifareClassicManufacturerBlock";
import MifareClassicSectorTrailerBlock from "@/models/MifareClassic/blocks/MifareClassicSectorTrailerBlock";
import MifareClassicUndefinedBlock from "@/models/MifareClassic/blocks/MifareClassicUndefinedBlock";
import { isValueBlock, MifareClassicValueBlock } from "@/models/MifareClassic/blocks/MifareClassicValueBlock";
import MifareClassicBlock from "@/models/MifareClassic/MifareClassicBlock";
import MifareClassicMemory from "@/models/MifareClassic/MifareClassicMemory";
import { PiccKey, PiccSector, UpdatablePiccSector } from "@/models/Picc";

export default class MifareClassicSector implements PiccSector {
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
