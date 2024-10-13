import mitt from "mitt";
import SectorAuthFormShownEvent from "./events/SectorAuthFormShownEvent";

const sectorEmits = mitt<{
  sectorAuthFormShown: SectorAuthFormShownEvent;
}>();

export default sectorEmits;
