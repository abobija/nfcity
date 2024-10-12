export enum PiccKeyTypeDto {
  A = 0,
  B = 1,
}

export default interface PiccKeyDto {
  value: Uint8Array;
  type: PiccKeyTypeDto;
}
