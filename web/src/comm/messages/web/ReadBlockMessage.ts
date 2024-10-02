import { AuthorizedWebMessage } from "../Message";

export const readBlockMessageKind = 'read_block';

export default interface ReadBlockMessage extends AuthorizedWebMessage {
  address: number;
}
