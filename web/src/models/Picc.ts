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

type Bit = number;
type BlockAddress = number;

export type KeyA = 0;
export type KeyB = 1;
export type KeyType = KeyA | KeyB;

export const keyA = 0 as KeyA;
export const keyB = 1 as KeyB;

export interface PiccKey {
  value: number[];
  type: KeyType;
}

export interface PiccBlockAccessBits {
  c1: Bit;
  c2: Bit;
  c3: Bit;
}

export interface PiccBlock {
  address: BlockAddress;
  data: Uint8Array;
  accessBits: PiccBlockAccessBits;
}

export interface PiccSector {
  key: PiccKey;
  blocks: PiccBlock[];
  block0Address: BlockAddress;
}

export interface UpdatablePiccBlock extends Pick<PiccBlock, 'address' | 'data'> { }

export interface UpdatablePiccSector extends Pick<PiccSector, 'key'> {
  blocks: UpdatablePiccBlock[];
}

export interface PiccMemory {
  sectors: PiccSector[];
}

export default interface Picc {
  type: PiccType;
  state: PiccState;
  atqa: number;
  sak: number;
  uid: Uint8Array;
  memory: PiccMemory;
}
