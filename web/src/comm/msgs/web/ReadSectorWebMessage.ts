import { AuthorizedWebMessage } from "../Message";

export const readSectorWebMessageKind = 'read_sector';

export default interface ReadSectorWebMessage extends AuthorizedWebMessage {
  offset: number;
}
