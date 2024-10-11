import clientEmits from "@/comm/clientEmits";
import ClientMessageEvent from "@/comm/events/ClientMessageEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientMessage(hook: (e: ClientMessageEvent) => void) {
  onMounted(() => clientEmits.on('message', hook));
  onUnmounted(() => clientEmits.off('message', hook));
}
