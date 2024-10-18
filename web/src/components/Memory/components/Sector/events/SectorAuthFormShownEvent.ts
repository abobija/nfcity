import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { SectorEvent } from "@Memory/components/Sector/events/SectorEvent";

export default class SectorAuthFormShownEvent extends SectorEvent {
  constructor(
    readonly sector: MifareClassicSector,
  ) {
    super();
  }
}
