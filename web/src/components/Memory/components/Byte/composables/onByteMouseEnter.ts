
import { onMounted, onUnmounted } from "vue";
import byteEmits from "../byteEmits";
import ByteEvent from "../events/ByteEvent";

export default function onByteMouseEnter(hook: (e: ByteEvent) => void) {
  onMounted(() => byteEmits.on('mouseEnter', hook));
  onUnmounted(() => byteEmits.off('mouseEnter', hook));
}
