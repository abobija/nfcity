import mitt from "mitt";
import MemorySectorUnlockEvent from "./MemorySectorUnlockEvent";

const emits = mitt<{
  unlock: MemorySectorUnlockEvent;
}>();

export default emits;
