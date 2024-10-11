import PiccDto from "@/communication/dtos/PiccDto";
import { DeviceMessage } from "@/communication/Message";

export default class PiccStateChangedDeviceMessage extends DeviceMessage {
  readonly old_state: number;
  readonly picc: PiccDto;

  protected constructor(old_state: number, picc: PiccDto) {
    super('picc_state_changed');
    this.old_state = old_state;
    this.picc = picc;
  }

  static from(old_state: number, picc: PiccDto): PiccStateChangedDeviceMessage {
    return new PiccStateChangedDeviceMessage(old_state, picc);
  }

  static is(message: DeviceMessage): message is PiccStateChangedDeviceMessage {
    return message.$kind === 'picc_state_changed';
  }
}
