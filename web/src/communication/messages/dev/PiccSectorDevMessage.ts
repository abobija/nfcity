import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import { DeviceMessage } from "@/communication/Message";

export default class PiccSectorDevMessage extends DeviceMessage {
  readonly offset: number;
  readonly blocks: PiccBlockDto[];

  protected constructor(offset: number, blocks: PiccBlockDto[]) {
    super('picc_sector');
    this.offset = offset;
    this.blocks = blocks;
  }

  static from(offset: number, blocks: PiccBlockDto[]): PiccSectorDevMessage {
    return new PiccSectorDevMessage(offset, blocks);
  }

  static is(message: DeviceMessage): message is PiccSectorDevMessage {
    return message.$kind === 'picc_sector';
  }
}
