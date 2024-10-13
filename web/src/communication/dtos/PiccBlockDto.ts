import Dto from "@/communication/Dto";

export default interface PiccBlockDto extends Dto {
  readonly address: number;
  readonly data: Uint8Array;
}
