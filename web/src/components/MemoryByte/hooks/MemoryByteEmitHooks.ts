
import memoryByteEmits from "@/components/MemoryByte/events/MemoryByteEmits";
import MemoryByteEvent from "@/components/MemoryByte/events/MemoryByteEvent";
import { onMounted, onUnmounted } from "vue";

export function onMemoryByteMouseEnter(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => memoryByteEmits.on('mouseEnter', hook));
  onUnmounted(() => memoryByteEmits.off('mouseEnter', hook));
}

export function onMemoryByteMouseLeave(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => memoryByteEmits.on('mouseLeave', hook));
  onUnmounted(() => memoryByteEmits.off('mouseLeave', hook));
}

export function onMemoryByteMouseClick(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => memoryByteEmits.on('mouseClick', hook));
  onUnmounted(() => memoryByteEmits.off('mouseClick', hook));
}
