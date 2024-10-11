import clientEmits from "@/comm/clientEmits";
import ClientPongMissedEvent from "@/comm/events/ClientPongMissedEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientPongMissed(hook: (e: ClientPongMissedEvent) => void) {
  onMounted(() => clientEmits.on('pongMissed', hook));
  onUnmounted(() => clientEmits.off('pongMissed', hook));
}
