import PiccBlockDto from "../../dtos/PiccBlockDto";
import { DeviceMessage } from "../Message";

export const piccBlockMessageKind = 'picc_block';

export default interface PiccBlockMessage extends DeviceMessage {
  block: PiccBlockDto;
}

export function isPiccBlockMessage(message: DeviceMessage): message is PiccBlockMessage {
  return message.kind === piccBlockMessageKind;
}
