import PiccBlockDto from "./PiccBlockDto";

export default interface PiccSectorDto {
  readonly offset: number;
  readonly blocks: PiccBlockDto[];
}
