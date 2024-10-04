import mitt from "mitt";
import { onMounted, onUnmounted } from "vue";
import MemoryByteEvent from "./MemoryByteEvent";

const emits = mitt<{
  byteMouseEnter: MemoryByteEvent;
  byteMouseLeave: MemoryByteEvent;
  byteMouseClick: MemoryByteEvent;
}>();

export function onMemoryByteMouseEnter(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => emits.on('byteMouseEnter', hook));
  onUnmounted(() => emits.off('byteMouseEnter', hook));
}

export function onMemoryByteMouseLeave(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => emits.on('byteMouseLeave', hook));
  onUnmounted(() => emits.off('byteMouseLeave', hook));
}

export function onMemoryByteMouseClick(hook: (e: MemoryByteEvent) => void) {
  onMounted(() => emits.on('byteMouseClick', hook));
  onUnmounted(() => emits.off('byteMouseClick', hook));
}

export default emits;
