import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import { DeviceMessage } from "@/communication/Message";

export default class PiccSectorDeviceMessage extends DeviceMessage {
  readonly offset: number;
  readonly blocks: PiccBlockDto[];

  protected constructor(offset: number, blocks: PiccBlockDto[]) {
    super('picc_sector');
    this.offset = offset;
    this.blocks = blocks;
  }

  static from(offset: number, blocks: PiccBlockDto[]): PiccSectorDeviceMessage {
    return new PiccSectorDeviceMessage(offset, blocks);
  }

  static is(message: DeviceMessage): message is PiccSectorDeviceMessage {
    return message.$kind === 'picc_sector';
  }
}
