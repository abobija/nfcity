import SectorAuthFormShownEvent from "@Memory/components/Sector/events/SectorAuthFormShownEvent";
import mitt from "mitt";

const sectorEmits = mitt<{
  sectorAuthFormShown: SectorAuthFormShownEvent;
}>();

export default sectorEmits;
