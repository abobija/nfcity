import { AuthorizedWebMessage } from "@/comm/msgs/Message";

export const readBlockWebMessageKind = 'read_block';

export default interface ReadBlockWebMessage extends AuthorizedWebMessage {
  address: number;
}
