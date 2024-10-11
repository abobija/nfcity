import clientEmits from "@/communication/clientEmits";
import ClientCloseEvent from "@/communication/events/ClientCloseEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientClose(hook: (e: ClientCloseEvent) => void) {
  onMounted(() => clientEmits.on('close', hook));
  onUnmounted(() => clientEmits.off('close', hook));
}
