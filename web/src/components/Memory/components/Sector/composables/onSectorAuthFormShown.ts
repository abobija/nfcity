
import SectorAuthFormShownEvent from "@Memory/components/Sector/events/SectorAuthFormShownEvent";
import sectorEmits from "@Memory/components/Sector/sectorEmits";
import { onMounted, onUnmounted } from "vue";

export default function onSectorAuthFormShown(hook: (e: SectorAuthFormShownEvent) => void) {
  onMounted(() => sectorEmits.on('sectorAuthFormShown', hook));
  onUnmounted(() => sectorEmits.off('sectorAuthFormShown', hook));
}
