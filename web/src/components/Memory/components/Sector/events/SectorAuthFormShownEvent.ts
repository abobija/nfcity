import { MifareClassicSector } from "@/models/MifareClassic";
import { SectorEvent } from "./SectorEvent";

export default class SectorAuthFormShownEvent extends SectorEvent {
  constructor(
    readonly sector: MifareClassicSector,
  ) {
    super();
  }
}
