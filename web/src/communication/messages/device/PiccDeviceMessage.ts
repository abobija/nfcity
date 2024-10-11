import PiccDto from "@/communication/dtos/PiccDto";
import { DeviceMessage, DeviceMessageContext } from "@/communication/Message";

export default class PiccDeviceMessage implements DeviceMessage {
  readonly $kind: string = 'picc';
  readonly picc: PiccDto;
  readonly $ctx?: DeviceMessageContext | undefined;

  protected constructor(picc: PiccDto) {
    this.picc = picc;
  }

  static from(picc: PiccDto): PiccDeviceMessage {
    return new PiccDeviceMessage(picc);
  }

  static is(message: DeviceMessage): message is PiccDeviceMessage {
    return message.$kind === 'picc';
  }
}
