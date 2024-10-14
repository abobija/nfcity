import { MifareClassicBlockGroup } from "@/models/MifareClassic";

export default class ByteFocus {
  constructor(
    readonly group: MifareClassicBlockGroup,
    readonly index: number, // Index withing the block
  ) { }
}
