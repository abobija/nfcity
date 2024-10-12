import mitt from "mitt";
import MemoryBlockUpdatedEvent from "./events/MemoryBlockUpdatedEvent";

const memoryEditorEmits = mitt<{
  memoryBlockUpdated: MemoryBlockUpdatedEvent;
}>();

export default memoryEditorEmits;
