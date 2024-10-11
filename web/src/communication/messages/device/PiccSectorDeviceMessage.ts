import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import PiccSectorDto from "@/communication/dtos/PiccSectorDto";
import { DeviceMessage, DeviceMessageContext } from "@/communication/Message";

export default class PiccSectorDeviceMessage implements DeviceMessage, PiccSectorDto {
  readonly $kind: string = 'picc_sector';
  readonly $ctx?: DeviceMessageContext | undefined;
  readonly offset: number;
  readonly blocks: PiccBlockDto[];

  protected constructor(offset: number, blocks: PiccBlockDto[]) {
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
