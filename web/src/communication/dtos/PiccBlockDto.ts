export default interface PiccBlockDto {
  readonly address: number;
  readonly offset: number;
  readonly data: Uint8Array;
}
