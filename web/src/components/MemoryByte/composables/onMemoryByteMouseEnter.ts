import MemoryByteEvent from "@/components/MemoryByte/events/MemoryByteEvent";
import memoryByteEmits from "@/components/MemoryByte/memoryByteEmits";
import { onMounted, onUnmounted } from "vue";

export default function onMemoryByteMouseEnter(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => memoryByteEmits.on('mouseEnter', hook));
  onUnmounted(() => memoryByteEmits.off('mouseEnter', hook));
}
