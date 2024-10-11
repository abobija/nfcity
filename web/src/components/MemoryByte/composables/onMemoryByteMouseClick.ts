import MemoryByteEvent from "@/components/MemoryByte/events/MemoryByteEvent";
import memoryByteEmits from "@/components/MemoryByte/memoryByteEmits";
import { onMounted, onUnmounted } from "vue";

export default function onMemoryByteMouseClick(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => memoryByteEmits.on('mouseClick', hook));
  onUnmounted(() => memoryByteEmits.off('mouseClick', hook));
}
