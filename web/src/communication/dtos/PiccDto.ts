import Dto from "@/communication/Dto";

export default interface PiccDto extends Dto {
  readonly type: number;
  readonly state: number;
  readonly atqa: number;
  readonly sak: number;
  readonly uid: Uint8Array;
}
