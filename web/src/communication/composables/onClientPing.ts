import clientEmits from "@/communication/clientEmits";
import ClientPingEvent from "@/communication/events/ClientPingEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientPing(hook: (e: ClientPingEvent) => void) {
  onMounted(() => clientEmits.on('ping', hook));
  onUnmounted(() => clientEmits.off('ping', hook));
}
