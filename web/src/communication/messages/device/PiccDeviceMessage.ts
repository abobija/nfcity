import PiccDto from "@/communication/dtos/PiccDto";
import { DeviceMessage } from "@/communication/Message";

export default interface PiccDeviceMessage extends DeviceMessage {
  readonly picc: PiccDto;
}

export function isPiccDeviceMessage(message: DeviceMessage): message is PiccDeviceMessage {
  return message.$kind === 'picc';
}
