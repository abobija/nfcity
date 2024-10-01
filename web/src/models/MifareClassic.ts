import Picc, { PiccMemory, PiccState, PiccType } from "./Picc";

export default class MifareClassic implements Picc {
  public readonly type: PiccType;
  public readonly state: PiccState;
  public readonly atqa: number;
  public readonly sak: number;
  public readonly uid: Uint8Array;
  public readonly memory: PiccMemory;

  protected constructor(picc: Picc) {
    this.type = picc.type;
    this.state = picc.state;
    this.atqa = picc.atqa;
    this.sak = picc.sak;
    this.uid = picc.uid;

    this.memory = {
      sectors: new Map(
        Array.from({ length: this.numberOfSectors })
          .map((_, i) => [i, { blocks: new Map() }])
      )
    };
  }

  public static from(picc: Picc): MifareClassic {
    return new MifareClassic(picc);
  }

  public static isMifareClassic(picc: Picc): picc is MifareClassic {
    return picc.type === PiccType.Mifare1K || picc.type === PiccType.Mifare4K
      || picc.type === PiccType.MifareMini;
  }

  get numberOfSectors(): number {
    switch (this.type) {
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

  public numberOfBlocks(sectorOffset: number): number {
    if (sectorOffset < 32) {
      return 4;
    }

    return 16;
  }

  get blockSize(): number {
    return 16;
  }
}
