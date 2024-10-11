import PiccDto from "./PiccDto";

export default interface PiccStateChangeDto {
  old_state: number;
  picc: PiccDto;
}
