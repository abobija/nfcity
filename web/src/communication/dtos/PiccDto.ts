export default interface PiccDto {
  readonly type: number;
  readonly state: number;
  readonly atqa: number;
  readonly sak: number;
  readonly uid: Uint8Array;
}
