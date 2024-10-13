import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class ByteEvent {
  readonly index: number;
  readonly group: MifareClassicBlockGroup;

  protected constructor(index: number, group: MifareClassicBlockGroup) {
    this.index = index;
    this.group = group;
  }

  static from(index: number, group: MifareClassicBlockGroup): ByteEvent {
    return new ByteEvent(index, group);
  }
}
