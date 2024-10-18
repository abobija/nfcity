import MifareClassicBlockGroup from "@/models/MifareClassic/MifareClassicBlockGroup";

export default class ByteEvent {
  constructor(
    readonly index: number,
    readonly group: MifareClassicBlockGroup
  ) {
    this.index = index;
    this.group = group;
  }
}
