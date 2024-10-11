import PiccStateChangeDto from "@/communication/dtos/PiccStateChangeDto";
import { DeviceMessage } from "@/communication/Message";

export default interface PiccStateChangedDeviceMessage extends DeviceMessage, PiccStateChangeDto { }

export function isPiccStateChangedDeviceMessage(message: DeviceMessage): message is PiccStateChangedDeviceMessage {
  return message.$kind === 'picc_state_changed';
}
