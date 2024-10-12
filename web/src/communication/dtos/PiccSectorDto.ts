import PiccBlockDto from "@/communication/dtos/PiccBlockDto";

export default interface PiccSectorDto {
  readonly offset: number;
  readonly blocks: PiccBlockDto[];
}
