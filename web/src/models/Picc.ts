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

export type KeyType = 0 | 1;

export const keyA = 0 as KeyType;
export const keyB = 1 as KeyType;

export function keyTypeName(keyType: KeyType): string {
  return keyType === keyA ? 'A' : 'B';
}

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
  address: number;
  data: number[];
  accessBits: PiccBlockAccessBits;
}

export interface PiccSector {
  key?: PiccKey;
  blocks: PiccBlock[];
  block0Address: number;
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
  uid: number[];
  memory: PiccMemory;
}

export const everyAccessBitCombo = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export type AccessBitsCombo = typeof everyAccessBitCombo[number];

export function calculateAccessBitsCombo(accessBits: PiccBlockAccessBits): AccessBitsCombo {
  return ((
    (accessBits.c1 << 2)
    | (accessBits.c2 << 1)
    | (accessBits.c3 << 0)
  ) & 0b111) as AccessBitsCombo;
}

export function calculateAccessBitsFromCombo(combo: AccessBitsCombo): PiccBlockAccessBits {
  return {
    c1: (combo >> 2) & 1,
    c2: (combo >> 1) & 1,
    c3: (combo >> 0) & 1,
  };
}
