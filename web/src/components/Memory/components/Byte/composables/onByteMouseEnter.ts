
import byteEmits from "@Memory/components/Byte/byteEmits";
import ByteEvent from "@Memory/components/Byte/events/ByteEvent";
import { onMounted, onUnmounted } from "vue";

export default function onByteMouseEnter(hook: (e: ByteEvent) => void) {
  onMounted(() => byteEmits.on('mouseEnter', hook));
  onUnmounted(() => byteEmits.off('mouseEnter', hook));
}
