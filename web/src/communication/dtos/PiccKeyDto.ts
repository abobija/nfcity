import Dto from "@/communication/Dto";

export default interface PiccKeyDto extends Dto {
  value: Uint8Array;
  type: 0 | 1;
}
