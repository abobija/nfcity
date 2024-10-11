import PiccBlockDto from "./PiccBlockDto";

export default interface PiccSectorDto {
  offset: number;
  blocks: PiccBlockDto[];
}
