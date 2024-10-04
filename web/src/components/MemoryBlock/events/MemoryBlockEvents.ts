import mitt from "mitt";
import { onMounted, onUnmounted } from "vue";
import MemoryBlockByteEvent from "./MemoryBlockByteEvent";

const emits = mitt<{
  byteEnter: MemoryBlockByteEvent;
  byteLeave: MemoryBlockByteEvent;
  byteClick: MemoryBlockByteEvent;
}>();

export function onMemoryBlockByteEnter(hook: (e: MemoryBlockByteEvent) => void) {
  onMounted(() => emits.on('byteEnter', hook));
  onUnmounted(() => emits.off('byteEnter', hook));
}

export function onMemoryBlockByteLeave(hook: (e: MemoryBlockByteEvent) => void) {
  onMounted(() => emits.on('byteLeave', hook));
  onUnmounted(() => emits.off('byteLeave', hook));
}

export function onMemoryBlockByteClick(hook: (e: MemoryBlockByteEvent) => void) {
  onMounted(() => emits.on('byteClick', hook));
  onUnmounted(() => emits.off('byteClick', hook));
}

export default emits;
