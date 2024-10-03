<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import { MifareClassicMemory } from '@/models/MifareClassic';

defineProps<{
  memory: MifareClassicMemory;
}>();

defineEmits<{
  (e: 'blockClick', data: MemoryBlockClickEvent): void;
}>();
</script>

<template>
  <div class="memory component">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: memory.numberOfSectors })" :key="sectorOffset"
      :sector="memory.sectorAt(sectorOffset)" @block-click="e => $emit('blockClick', e)" />
  </div>
</template>
