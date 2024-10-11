import clientEmits from "@/comm/clientEmits";
import ClientPingEvent from "@/comm/events/ClientPingEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientPing(hook: (e: ClientPingEvent) => void) {
  onMounted(() => clientEmits.on('ping', hook));
  onUnmounted(() => clientEmits.off('ping', hook));
}
