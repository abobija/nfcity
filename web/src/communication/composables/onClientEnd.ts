import clientEmits from "@/communication/clientEmits";
import ClientEndEvent from "@/communication/events/ClientEndEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientEnd(hook: (e: ClientEndEvent) => void) {
  onMounted(() => clientEmits.on('end', hook));
  onUnmounted(() => clientEmits.off('end', hook));
}
