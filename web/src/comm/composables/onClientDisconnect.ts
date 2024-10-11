import clientEmits from "@/comm/clientEmits";
import ClientDisconnectEvent from "@/comm/events/ClientDisconnectEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientDisconnect(hook: (e: ClientDisconnectEvent) => void) {
  onMounted(() => clientEmits.on('disconnect', hook));
  onUnmounted(() => clientEmits.off('disconnect', hook));
}
