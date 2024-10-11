import clientEmits from "@/comm/clientEmits";
import ClientReadyEvent from "@/comm/events/ClientReadyEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientReady(hook: (e: ClientReadyEvent) => void) {
  onMounted(() => clientEmits.on('ready', hook));
  onUnmounted(() => clientEmits.off('ready', hook));
}
