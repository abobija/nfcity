<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import { MifareClassicMemory } from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryFocus from './MemoryFocus';

defineProps<{
  memory: MifareClassicMemory;
  focus?: MemoryFocus;
}>();

const classes = computed(() => ({
  focused: focus !== undefined,
}));
</script>

<template>
  <div class="memory component" :class="classes">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: memory.numberOfSectors })" :key="sectorOffset"
      :sector="memory.sectorAt(sectorOffset)" :focus="focus?.sectorFocus" />
  </div>
</template>
