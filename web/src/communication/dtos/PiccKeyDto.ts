import { KeyType } from "@/models/Picc";

export default interface PiccKeyDto {
  value: Uint8Array;
  type: KeyType;
}
