import clientEmits from "@/communication/clientEmits";
import ClientReconnectEvent from "@/communication/events/ClientReconnectEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientReconnect(hook: (e: ClientReconnectEvent) => void) {
  onMounted(() => clientEmits.on('reconnect', hook));
  onUnmounted(() => clientEmits.off('reconnect', hook));
}
