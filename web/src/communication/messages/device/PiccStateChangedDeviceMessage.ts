import PiccDto from "@/communication/dtos/PiccDto";
import PiccStateChangeDto from "@/communication/dtos/PiccStateChangeDto";
import { DeviceMessage, DeviceMessageContext } from "@/communication/Message";

export default class PiccStateChangedDeviceMessage implements DeviceMessage, PiccStateChangeDto {
  readonly $kind: string = 'picc_state_changed';
  readonly $ctx?: DeviceMessageContext | undefined;
  readonly old_state: number;
  readonly picc: PiccDto;

  protected constructor(old_state: number, picc: PiccDto) {
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
