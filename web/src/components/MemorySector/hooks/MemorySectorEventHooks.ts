
import { onMounted, onUnmounted } from "vue";
import emits from "../events/MemorySectorEvents";
import MemorySectorUnlockEvent from "../events/MemorySectorUnlockEvent";

export function onMemorySectorUnlock(hook: (e: MemorySectorUnlockEvent) => void) {
  onMounted(() => emits.on('unlock', hook));
  onUnmounted(() => emits.off('unlock', hook));
}
