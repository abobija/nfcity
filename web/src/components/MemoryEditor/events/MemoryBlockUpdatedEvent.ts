import { UpdatedPiccBlock } from "@/models/Picc";
import MemoryEditorEvent from "./MemoryEditorEvent";

export default class MemoryBlockUpdatedEvent extends MemoryEditorEvent {
  readonly updatedBlock: UpdatedPiccBlock;

  protected constructor(updatedBlock: UpdatedPiccBlock) {
    super();
    this.updatedBlock = updatedBlock;
  }

  static from(updatedBlock: UpdatedPiccBlock): MemoryBlockUpdatedEvent {
    return new MemoryBlockUpdatedEvent(updatedBlock);
  }
}
