import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default interface TargetByte {
  index: number;
  group: MifareClassicBlockGroup;
  locked: boolean;
}
