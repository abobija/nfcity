<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemoryFocus from "@/components/Memory/MemoryFocus";
import Sector from "@/components/Memory/components/Sector/Sector.vue";
import SectorState from "@/components/Memory/components/Sector/SectorState";
import { MifareClassicMemory } from "@/models/MifareClassic";
import { computed, ref } from "vue";

const props = defineProps<{
  memory: MifareClassicMemory;
  focus?: MemoryFocus;
}>();

const classes = computed(() => ({
  focused: focus !== undefined,
}));

const sectorStates = ref<Map<number, SectorState>>(new Map());

function sectorState(sectorOffset: number): SectorState {
  return !props.memory.sectorAtOffset(sectorOffset).isEmpty
    ? SectorState.UnlockedAndLoaded
    : sectorStates.value.get(sectorOffset) ?? SectorState.Empty;
}

function changeSectorState(sectorOffset: number, state: SectorState) {
  for (const [offset, s] of sectorStates.value) {
    if (s === SectorState.Unlock) {
      sectorStates.value.set(offset, SectorState.Empty);
    }
  }

  sectorStates.value.set(sectorOffset, state);
}
</script>

<template>
  <div class="Memory" :class="classes">
    <Sector v-for="(sector, sectorOffset) in memory.sectors" :key="sectorOffset" :sector
      :state="sectorState(sectorOffset)" :focus="focus?.sectorFocus"
      @state-change="(newState) => changeSectorState(sectorOffset, newState)" />
  </div>
</template>
