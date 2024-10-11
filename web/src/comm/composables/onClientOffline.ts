import clientEmits from "@/comm/clientEmits";
import ClientOfflineEvent from "@/comm/events/ClientOfflineEvent";
import { onMounted, onUnmounted } from "vue";

export default function onClientOffline(hook: (e: ClientOfflineEvent) => void) {
  onMounted(() => clientEmits.on('offline', hook));
  onUnmounted(() => clientEmits.off('offline', hook));
}
