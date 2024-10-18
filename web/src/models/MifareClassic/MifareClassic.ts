import PiccDto from "@/communication/dtos/PiccDto";
import MifareClassicMemory from "@/models/MifareClassic/MifareClassicMemory";
import Picc, {
  PiccState,
  PiccType
} from "@/models/Picc";
import {
  hash
} from "@/utils/helpers";

export const blockSize = 16;

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
