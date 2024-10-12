import { PiccKeyType } from "@/models/Picc";

export default interface PiccKeyDto {
  value: Uint8Array;
  type: PiccKeyType;
}
