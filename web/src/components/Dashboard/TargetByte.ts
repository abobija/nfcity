import MifareClassicBlockGroup from "@/models/MifareClassic/MifareClassicBlockGroup";

export default interface TargetByte {
  index: number;
  group: MifareClassicBlockGroup;
  locked: boolean;
}
