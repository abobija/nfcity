import clientEmits from "@/communication/clientEmits";
import ClientMessageEvent from "@/communication/events/ClientMessageEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientMessage(hook: (e: ClientMessageEvent) => void) {
  onMounted(() => clientEmits.on('message', hook));
  onUnmounted(() => clientEmits.off('message', hook));
}
