import { MifareClassicSector } from "@/models/MifareClassic";
import { SectorEvent } from "@Memory/components/Sector/events/SectorEvent";

export default class SectorAuthFormShownEvent extends SectorEvent {
  constructor(
    readonly sector: MifareClassicSector,
  ) {
    super();
  }
}
