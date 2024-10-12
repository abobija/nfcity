import mitt from "mitt";
import MemoryBlockUpdatedEvent from "./events/MemoryBlockUpdatedEvent";

const memoryEditorEmits = mitt<{
  blockUpdated: MemoryBlockUpdatedEvent;
}>();

export default memoryEditorEmits;
