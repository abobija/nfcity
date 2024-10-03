<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import { MifareClassicMemory } from '@/models/MifareClassic';

defineProps<{
  memory: MifareClassicMemory;
}>();
</script>

<template>
  <div class="memory component">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: memory.numberOfSectors })" :key="sectorOffset"
      :sector="memory.sectorAt(sectorOffset)" />
  </div>
</template>
