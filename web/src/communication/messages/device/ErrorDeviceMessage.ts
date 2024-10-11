import { DeviceMessage } from "@/communication/Message";

export default interface ErrorDeviceMessage extends DeviceMessage { }

export function isErrorDeviceMessage(message: DeviceMessage): message is ErrorDeviceMessage {
  return message.$kind === 'error';
}
