import { onMounted, onUnmounted } from "vue";
import byteEmits from "../byteEmits";
import ByteEvent from "../events/ByteEvent";

export default function onByteMouseLeave(hook: (e: ByteEvent) => void) {
  onMounted(() => byteEmits.on('mouseLeave', hook));
  onUnmounted(() => byteEmits.off('mouseLeave', hook));
}
