
import MemoryByteEvent from "@/components/MemoryByte/events/MemoryByteEvent";
import emits from "@/components/MemoryByte/events/MemoryByteEvents";
import { onMounted, onUnmounted } from "vue";

export function onMemoryByteMouseEnter(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => emits.on('mouseEnter', hook));
  onUnmounted(() => emits.off('mouseEnter', hook));
}

export function onMemoryByteMouseLeave(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => emits.on('mouseLeave', hook));
  onUnmounted(() => emits.off('mouseLeave', hook));
}

export function onMemoryByteMouseClick(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => emits.on('mouseClick', hook));
  onUnmounted(() => emits.off('mouseClick', hook));
}
