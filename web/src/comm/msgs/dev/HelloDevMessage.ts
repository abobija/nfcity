import { DeviceMessage } from "@/comm/msgs/Message";

/**
 * Message sent by the device on connection with the broker.
 */
export default interface HelloDevMessage extends DeviceMessage { }

export function isHelloDevMessage(message: DeviceMessage): message is HelloDevMessage {
  return message.kind === 'hello';
}
