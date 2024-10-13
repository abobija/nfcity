import Dto from "@/communication/Dto";
import PiccDto from "@/communication/dtos/PiccDto";

export default interface PiccStateChangeDto extends Dto {
  readonly old_state: number;
  readonly picc: PiccDto;
}
