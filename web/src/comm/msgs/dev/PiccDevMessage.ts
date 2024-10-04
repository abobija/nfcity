import PiccDto from "@/comm/dtos/PiccDto";
import { DeviceMessage } from "@/comm/msgs/Message";

export default class PiccDevMessage extends DeviceMessage {
  readonly picc: PiccDto;

  protected constructor(picc: PiccDto) {
    super('picc');
    this.picc = picc;
  }

  static from(picc: PiccDto): PiccDevMessage {
    return new PiccDevMessage(picc);
  }

  static is(message: DeviceMessage): message is PiccDevMessage {
    return message.$kind === 'picc';
  }
}
