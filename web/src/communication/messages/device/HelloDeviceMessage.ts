import { DeviceMessage } from "@/communication/Message";

/**
 * Message sent by the device on connection with the broker.
 */
export default interface HelloDeviceMessage extends DeviceMessage { }

export function isHelloDeviceMessage(message: DeviceMessage): message is HelloDeviceMessage {
  return message.$kind === 'hello';
}
