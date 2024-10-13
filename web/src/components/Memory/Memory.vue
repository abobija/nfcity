<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemoryFocus from "@/components/Memory/MemoryFocus";
import MemorySector from "@/components/MemorySector/MemorySector.vue";
import MemorySectorState from "@/components/MemorySector/MemorySectorState";
import { MifareClassicMemory } from "@/models/MifareClassic";
import { computed, ref } from "vue";

const props = defineProps<{
  memory: MifareClassicMemory;
  focus?: MemoryFocus;
}>();

const classes = computed(() => ({
  focused: focus !== undefined,
}));

const sectorStates = ref<Map<number, MemorySectorState>>(new Map());

function sectorState(sectorOffset: number): MemorySectorState {
  return !props.memory.sectorAtOffset(sectorOffset).isEmpty
    ? MemorySectorState.UnlockedAndLoaded
    : sectorStates.value.get(sectorOffset) ?? MemorySectorState.Empty;
}

function changeSectorState(sectorOffset: number, state: MemorySectorState) {
  for (const [offset, s] of sectorStates.value) {
    if (s === MemorySectorState.Unlock) {
      sectorStates.value.set(offset, MemorySectorState.Empty);
    }
  }

  sectorStates.value.set(sectorOffset, state);
}
</script>

<template>
  <div class="Memory" :class="classes">
    <MemorySector v-for="(sector, sectorOffset) in memory.sectors" :key="sectorOffset" :sector
      :state="sectorState(sectorOffset)" :focus="focus?.sectorFocus"
      @state-change="(newState) => changeSectorState(sectorOffset, newState)" />
  </div>
</template>
