import PiccBlockDto from "@/communication/dtos/PiccBlockDto";
import { DeviceMessage } from "@/communication/Message";

export interface PiccBlockDeviceMessage extends DeviceMessage, PiccBlockDto { }

export function isPiccBlockDeviceMessage(message: DeviceMessage): message is PiccBlockDeviceMessage {
  return message.$kind === 'picc_block';
}
