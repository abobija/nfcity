import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import PiccDto from "@/communication/dtos/PiccDto";
import PiccSectorDto from "@/communication/dtos/PiccSectorDto";
import Picc, { PiccBlock, PiccBlockAccessBits, PiccKey, PiccKeyType, PiccMemory, PiccSector, PiccState, PiccType } from "@/models/Picc";
import { arrEquals, hex2arr, nibbles } from "@/utils/helpers";

const defaultKey: PiccKey = {
  type: PiccKeyType.A,
  value: hex2arr('FFFFFFFFFFFF'),
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

export class MifareClassicBlockGroup {
  private _block?: MifareClassicBlock;
  readonly type: MifareClassicBlockGroupType;
  readonly offset: number;
  readonly length: number;

  protected constructor(
    type: MifareClassicBlockGroupType,
    offset: number,
    length: number
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

  public hasSameTypeAs(that: MifareClassicBlockGroup): boolean {
    return this.type === that.type;
  }

  public isSameAs(that: MifareClassicBlockGroup): boolean {
    return this.block.hasSameAddressAs(that.block)
      && this.offset === that.offset
      && this.length === that.length;
  }

  static from(
    type: MifareClassicBlockGroupType,
    offset: number,
    length: number
  ) {
    return new MifareClassicBlockGroup(type, offset, length);
  }

  data(): Uint8Array {
    return this.block.data.slice(this.offset, this.offset + this.length);
  }
};

export abstract class MifareClassicBlock implements PiccBlock {
  static readonly size: number = 16;

  readonly type: MifareClassicBlockType;
  readonly sector: MifareClassicSector;
  readonly address: number;
  readonly offset: number;
  readonly data: Uint8Array;
  readonly accessBits: PiccBlockAccessBits;
  readonly blockGroups: MifareClassicBlockGroup[];

  protected constructor(
    type: MifareClassicBlockType,
    sector: MifareClassicSector,
    blockDto: PiccBlockDto,
    accessBits: PiccBlockAccessBits,
    bytesGroups: MifareClassicBlockGroup[]
  ) {
    this.type = type;
    this.sector = sector;
    this.address = blockDto.address;
    this.offset = blockDto.offset;
    this.data = blockDto.data;
    this.accessBits = accessBits;
    bytesGroups.forEach(group => group.block = this);
    this.blockGroups = bytesGroups;
  }

  get loaded(): Boolean {
    return this.data.length == MifareClassicBlock.size;
  }

  hasSameAddressAs(that: MifareClassicBlock): boolean {
    return this.address == that.address;
  }

  updateWith(blockDto: PiccBlockDto): void {
    const sector = this.sector;
    const trailerOffset = sector.numberOfBlocks - 1;

    if (blockDto.offset == trailerOffset) {

      sector.blocks[blockDto.offset] = MifareClassicSectorTrailerBlock.from(sector, blockDto);
      return;
    }

    const trailer = sector.blockAtOffset(trailerOffset);

    if (trailer === undefined || !(trailer instanceof MifareClassicSectorTrailerBlock)) {
      throw new Error('Trailer block not found');
    }

    const accessPoolIndex = MifareClassicSectorTrailerBlock.calculateBlockAccessBitsPoolIndex(
      blockDto.offset,
      sector.numberOfBlocks
    );
    const accessBits = trailer.accessBitsPool[accessPoolIndex];

    if (blockDto.address == 0) {
      sector.blocks[blockDto.offset] = MifareClassicManufacturerBlock.from(sector, blockDto, accessBits);
      return;
    }

    if (MifareClassicValueBlock.isValueBlock(accessBits)) {
      sector.blocks[blockDto.offset] = MifareClassicValueBlock.from(sector, blockDto, accessBits);
      return
    }

    sector.blocks[blockDto.offset] = MifareClassicDataBlock.from(sector, blockDto, accessBits);
  }
}

export class MifareClassicUndefinedBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, offset: number) {
    return new MifareClassicUndefinedBlock(
      MifareClassicBlockType.Undefined,
      sector,
      {
        offset,
        address: sector.block0Address + offset,
        data: new Uint8Array(0),
      },
      { c1: 0, c2: 0, c3: 0 },
      [
        MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Undefined, 0, MifareClassicBlock.size),
      ]);
  }
}

export class MifareClassicSectorTrailerBlock extends MifareClassicBlock {
  readonly accessBitsPool: Array<PiccBlockAccessBits>;

  constructor(sector: MifareClassicSector, block: PiccBlockDto, accessBitsPool: Array<PiccBlockAccessBits>) {
    if (accessBitsPool.length != 4) {
      throw new Error('Invalid access bits pool');
    }

    super(MifareClassicBlockType.SectorTrailer, sector, block, accessBitsPool[3], [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.KeyA, 0, 6),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.AccessBits, 6, 3),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.UserByte, 9, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.KeyB, 10, 6),
    ]);

    this.accessBitsPool = accessBitsPool;
  }

  static from(sector: MifareClassicSector, blockDto: PiccBlockDto) {
    const { data } = blockDto;

    if (MifareClassicSectorTrailerBlock.checkAccessBitsIntegrityViolation(data)) {
      throw new Error('Access bits integrity violation');
    }

    const [c1] = nibbles(data[7]);
    const [c3, c2] = nibbles(data[8])

    const accessBitsPool = Array<PiccBlockAccessBits>(4);

    for (let i = 0; i < 4; i++) {
      accessBitsPool[i] = this.nibblesToAccessBits(c1, c2, c3, i);
    }

    return new MifareClassicSectorTrailerBlock(sector, blockDto, accessBitsPool);
  }

  static calculateBlockAccessBitsPoolIndex(blockOffset: number, numberOfBlocks: number): number {
    if (numberOfBlocks > 4) {
      return Math.floor(blockOffset / 5);
    }

    return blockOffset;
  }

  private static nibblesToAccessBits(c1: number, c2: number, c3: number, offset: number): PiccBlockAccessBits {
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
  static from(sector: MifareClassicSector, blockDto: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    return new MifareClassicDataBlock(MifareClassicBlockType.Data, sector, blockDto, accessBits, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Data, 0, MifareClassicBlock.size),
    ]);
  }
}

export class MifareClassicValueBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, blockDto: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    // TODO: Parse

    return new MifareClassicValueBlock(MifareClassicBlockType.Value, sector, blockDto, accessBits, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Value, 0, 4),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.ValueInverted, 4, 4),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Value, 8, 4),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Address, 12, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.AddressInverted, 13, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Address, 14, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.AddressInverted, 15, 1),
    ]);
  }

  static isValueBlock(accessBits: PiccBlockAccessBits): Boolean {
    const bits = (accessBits.c1 << 2) | (accessBits.c2 << 1) | (accessBits.c3 << 0);

    return bits == 0b110 || bits == 0b001;
  }
}

export class MifareClassicManufacturerBlock extends MifareClassicBlock {
  static from(sector: MifareClassicSector, blockDto: PiccBlockDto, accessBits: PiccBlockAccessBits) {
    const { uid } = sector.memory.picc;

    return new MifareClassicManufacturerBlock(MifareClassicBlockType.Manufacturer, sector, blockDto, accessBits, [
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.UID, 0, uid.length),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.BCC, uid.length, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.SAK, uid.length + 1, 1),
      MifareClassicBlockGroup.from(MifareClassicBlockGroupType.ATQA, uid.length + 2, 2),
      MifareClassicBlockGroup.from(
        MifareClassicBlockGroupType.ManufacturerData,
        uid.length + 4,
        MifareClassicBlock.size - uid.length - 4
      ),
    ]);
  }
}

export class MifareClassicSector implements PiccSector {
  key: PiccKey = defaultKey;
  readonly memory: MifareClassicMemory;
  readonly offset: number;
  readonly blocks: MifareClassicBlock[];
  readonly block0Address: number;

  get numberOfBlocks() {
    return this.blocks.length;
  }

  // returns true if none of the blocks in the sector are loaded
  get isEmpty() {
    return Array.from(this.blocks.values()).every(block => !block.loaded);
  }

  protected constructor(memory: MifareClassicMemory, offset: number, blocks: MifareClassicBlock[]) {
    this.memory = memory;
    this.offset = offset;
    this.blocks = blocks;
    this.block0Address = MifareClassicMemory.sectorBlock0Address(offset);
  }

  static from(memory: MifareClassicMemory, offset: number, blocks: MifareClassicBlock[]) {
    return new MifareClassicSector(memory, offset, blocks);
  }

  hasSameOffsetAs(that: MifareClassicSector): boolean {
    return this.offset == that.offset;
  }

  blockAtOffset(offset: number): MifareClassicBlock {
    return this.blocks.at(offset)!; // FIXME: !
  }

  updateWith(sectorDto: PiccSectorDto): void {
    if (sectorDto.blocks.length != this.numberOfBlocks) {
      throw new Error('Invalid number of blocks');
    }

    sectorDto.blocks
      .sort((a, b) => b.address - a.address) // Sort so that trailer block is first
      .forEach(blockDto => this.blockAtOffset(blockDto.offset).updateWith(blockDto));
  }
}

export class MifareClassicMemory implements PiccMemory {
  readonly picc: MifareClassic;
  readonly sectors: MifareClassicSector[];
  readonly numberOfSectors: number;
  readonly blockDistribution: Array<[number, number]>;
  readonly size: number;

  protected constructor(picc: MifareClassic, piccType: PiccType) {
    this.picc = picc;
    this.numberOfSectors = MifareClassicMemory.numberOfSectors(piccType);

    // Initialize sectors
    this.sectors = Array.from({ length: this.numberOfSectors })
      .map((_, sectorOffset) => {
        const sector = MifareClassicSector.from(this, sectorOffset, []);

        // Initialize sector blocks
        Array.from({ length: MifareClassicMemory.numberOfBlocksInSector(sector.offset) })
          .forEach((_, blockOffset) => {
            sector.blocks.push(MifareClassicUndefinedBlock.from(sector, blockOffset))
          });

        return sector;
      });

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

  static from(picc: MifareClassic, piccType: PiccType) {
    return new MifareClassicMemory(picc, piccType);
  }

  sectorAtOffset(offset: number): MifareClassicSector {
    return this.sectors.at(offset)!; // FIXME: !
  }

  static numberOfBlocksInSector(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  static sectorOffset(blockAddress: number): number {
    if (blockAddress < 128) {
      return Math.floor(blockAddress / 4);
    }

    return 32 + Math.floor((blockAddress - 128) / 16);
  }

  static sectorBlock0Address(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return sectorOffset * 4;
    }

    return 128 + (sectorOffset - 32) * 16;
  }

  static blockOffset(blockAddress: number, sectorOffset: number): number {
    return blockAddress - MifareClassicMemory.sectorBlock0Address(sectorOffset);
  }

  static numberOfSectors(type: PiccType): number {
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
  readonly type: PiccType;
  state: PiccState;
  readonly atqa: number;
  readonly sak: number;
  readonly uid: Uint8Array;
  readonly memory: MifareClassicMemory;

  protected constructor(picc: Picc) {
    this.type = picc.type;
    this.state = picc.state;
    this.atqa = picc.atqa;
    this.sak = picc.sak;
    this.uid = picc.uid;
    this.memory = MifareClassicMemory.from(this, picc.type);
  }

  static fromDto(piccDto: PiccDto): MifareClassic {
    return new MifareClassic({
      type: piccDto.type,
      state: piccDto.state,
      atqa: piccDto.atqa,
      sak: piccDto.sak,
      uid: piccDto.uid,
      memory: {} as PiccMemory
    });
  }

  hasUidOf(picc: Picc | PiccDto): boolean {
    return arrEquals(this.uid, picc.uid);
  }

  static isMifareClassic(picc: Picc | PiccDto): boolean {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }
}
