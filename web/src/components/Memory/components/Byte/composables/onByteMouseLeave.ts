import byteEmits from "@Memory/components/Byte/byteEmits";
import ByteEvent from "@Memory/components/Byte/events/ByteEvent";
import { onMounted, onUnmounted } from "vue";

export default function onByteMouseLeave(hook: (e: ByteEvent) => void) {
  onMounted(() => byteEmits.on('mouseLeave', hook));
  onUnmounted(() => byteEmits.off('mouseLeave', hook));
}
