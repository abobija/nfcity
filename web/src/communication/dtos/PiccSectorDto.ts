import Dto from "@/communication/Dto";
import PiccBlockDto from "@/communication/dtos/PiccBlockDto";

export default interface PiccSectorDto extends Dto {
  readonly offset: number;
  readonly blocks: PiccBlockDto[];
}
