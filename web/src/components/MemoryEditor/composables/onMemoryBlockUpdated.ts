import { onMounted, onUnmounted } from "vue";
import MemoryBlockUpdatedEvent from "../events/MemoryBlockUpdatedEvent";
import memoryEditorEmits from "../memoryEditorEmits";

export default function onMemoryBlockUpdated(hook: (e: MemoryBlockUpdatedEvent) => void) {
  onMounted(() => memoryEditorEmits.on('memoryBlockUpdated', hook));
  onUnmounted(() => memoryEditorEmits.off('memoryBlockUpdated', hook));
}
