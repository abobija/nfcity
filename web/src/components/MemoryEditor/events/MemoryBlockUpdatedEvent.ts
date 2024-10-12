import { MifareClassicBlock } from "@/models/MifareClassic";
import MemoryEditorEvent from "./MemoryEditorEvent";

export default class MemoryBlockUpdatedEvent extends MemoryEditorEvent {
  protected constructor(readonly block: MifareClassicBlock) {
    super();
  }

  static from(block: MifareClassicBlock): MemoryBlockUpdatedEvent {
    return new MemoryBlockUpdatedEvent(block);
  }
}
