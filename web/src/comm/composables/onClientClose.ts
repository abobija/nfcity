import clientEmits from "@/comm/clientEmits";
import ClientCloseEvent from "@/comm/events/ClientCloseEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientClose(hook: (e: ClientCloseEvent) => void) {
  onMounted(() => clientEmits.on('close', hook));
  onUnmounted(() => clientEmits.off('close', hook));
}
