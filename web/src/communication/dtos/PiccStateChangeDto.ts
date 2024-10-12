import PiccDto from "@/communication/dtos/PiccDto";

export default interface PiccStateChangeDto {
  readonly old_state: number;
  readonly picc: PiccDto;
}
