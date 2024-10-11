import PiccDto from "@/communication/dtos/PiccDto";
import { DeviceMessage } from "@/communication/Message";

export default class PiccDeviceMessage extends DeviceMessage {
  readonly picc: PiccDto;

  protected constructor(picc: PiccDto) {
    super('picc');
    this.picc = picc;
  }

  static from(picc: PiccDto): PiccDeviceMessage {
    return new PiccDeviceMessage(picc);
  }

  static is(message: DeviceMessage): message is PiccDeviceMessage {
    return message.$kind === 'picc';
  }
}
