import PiccSectorDto from "@/communication/dtos/PiccSectorDto";
import { DeviceMessage } from "@/communication/Message";

export default interface PiccSectorDeviceMessage extends DeviceMessage, PiccSectorDto { }

export function isPiccSectorDeviceMessage(message: DeviceMessage): message is PiccSectorDeviceMessage {
  return message.$kind === 'picc_sector';
}
