import clientEmits from "@/communication/clientEmits";
import ClientPongEvent from "@/communication/events/ClientPongEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientPong(hook: (e: ClientPongEvent) => void) {
  onMounted(() => clientEmits.on('pong', hook));
  onUnmounted(() => clientEmits.off('pong', hook));
}
