import clientEmits from "@/comm/clientEmits";
import ClientReconnectEvent from "@/comm/events/ClientReconnectEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientReconnect(hook: (e: ClientReconnectEvent) => void) {
  onMounted(() => clientEmits.on('reconnect', hook));
  onUnmounted(() => clientEmits.off('reconnect', hook));
}
