import MemoryByteEvent from "@/components/MemoryByte/events/MemoryByteEvent";
import memoryByteEmits from "@/components/MemoryByte/memoryByteEmits";
import { onMounted, onUnmounted } from "vue";

export default function onMemoryByteMouseLeave(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => memoryByteEmits.on('mouseLeave', hook));
  onUnmounted(() => memoryByteEmits.off('mouseLeave', hook));
}
