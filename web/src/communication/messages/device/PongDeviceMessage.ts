import { DeviceMessage } from "@/communication/Message";

export default interface PongDeviceMessage extends DeviceMessage { }

export function isPongDeviceMessage(message: DeviceMessage): message is PongDeviceMessage {
  return message.$kind === 'pong';
}
