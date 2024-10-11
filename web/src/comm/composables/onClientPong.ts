import clientEmits from "@/comm/clientEmits";
import ClientPongEvent from "@/comm/events/ClientPongEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientPong(hook: (e: ClientPongEvent) => void) {
  onMounted(() => clientEmits.on('pong', hook));
  onUnmounted(() => clientEmits.off('pong', hook));
}
