import { AuthorizedWebMessage } from "../Message";

export const readSectorMessageKind = 'read_sector';

export default interface ReadSectorMessage extends AuthorizedWebMessage {
  offset: number;
}
