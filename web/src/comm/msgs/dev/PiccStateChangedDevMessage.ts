import PiccDto from "@/comm/dtos/PiccDto";
import { DeviceMessage } from "@/comm/msgs/Message";

export default class PiccStateChangedDevMessage extends DeviceMessage {
  readonly old_state: number;
  readonly picc: PiccDto;

  protected constructor(old_state: number, picc: PiccDto) {
    super('picc_state_changed');
    this.old_state = old_state;
    this.picc = picc;
  }

  static from(old_state: number, picc: PiccDto): PiccStateChangedDevMessage {
    return new PiccStateChangedDevMessage(old_state, picc);
  }

  static is(message: DeviceMessage): message is PiccStateChangedDevMessage {
    return message.$kind === 'picc_state_changed';
  }
}
