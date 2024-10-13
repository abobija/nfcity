
import byteEmits from "@Memory/components/Byte/byteEmits";
import ByteEvent from "@Memory/components/Byte/events/ByteEvent";
import { onMounted, onUnmounted } from "vue";

export default function onByteMouseClick(hook: (e: ByteEvent) => void) {
  onMounted(() => byteEmits.on('mouseClick', hook));
  onUnmounted(() => byteEmits.off('mouseClick', hook));
}
