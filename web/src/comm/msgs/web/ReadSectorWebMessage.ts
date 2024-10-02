import { AuthorizedWebMessage } from "@/comm/msgs/Message";

export const readSectorWebMessageKind = 'read_sector';

export default interface ReadSectorWebMessage extends AuthorizedWebMessage {
  offset: number;
}
