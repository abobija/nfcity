import clientEmits from "@/communication/clientEmits";
import ClientDisconnectEvent from "@/communication/events/ClientDisconnectEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientDisconnect(hook: (e: ClientDisconnectEvent) => void) {
  onMounted(() => clientEmits.on('disconnect', hook));
  onUnmounted(() => clientEmits.off('disconnect', hook));
}
