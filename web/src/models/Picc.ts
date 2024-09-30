export const numberOfSectors = 16;  // FIXME: for mifare 4k
export const numberOfBlocks = 4; // FIXME: for mifare 4k
export const blockSize = 16;

export enum PiccState {
  PowerOff = -1,
  Idle = 0,
  Ready,
  Active,
  Halt,
  ReadyH,
  ActiveH,
}

export enum PiccType {
  Unknown = -1,
  Undefined = 0,
  ISO14443_4,
  ISO18092,
  MifareMini,
  Mifare1K,
  Mifare4K,
  MifareUltralight,
  MifarePlus,
  MifareDesfire,
  Tnp3XXX,
}

export enum PiccKeyType {
  A = 0,
  B = 1,
}

export default interface Picc {
  type: PiccType;
  state: PiccState;
  atqa: number;
  sak: number;
  uid: Uint8Array;
}

export type Offset = number;

export interface PiccBlock {
  bytes: Uint8Array;
}

export interface PiccSector {
  blocks: Map<Offset, PiccBlock>;
}

export interface PiccMemory {
  sectors: Map<Offset, PiccSector>;
}
