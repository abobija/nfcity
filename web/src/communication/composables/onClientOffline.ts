import clientEmits from "@/communication/clientEmits";
import ClientOfflineEvent from "@/communication/events/ClientOfflineEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientOffline(hook: (e: ClientOfflineEvent) => void) {
  onMounted(() => clientEmits.on('offline', hook));
  onUnmounted(() => clientEmits.off('offline', hook));
}
