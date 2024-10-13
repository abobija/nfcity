
import { onMounted, onUnmounted } from "vue";
import SectorAuthFormShownEvent from "../events/SectorAuthFormShownEvent";
import sectorEmits from "../sectorEmits";

export default function onSectorAuthFormShown(hook: (e: SectorAuthFormShownEvent) => void) {
  onMounted(() => sectorEmits.on('sectorAuthFormShown', hook));
  onUnmounted(() => sectorEmits.off('sectorAuthFormShown', hook));
}
