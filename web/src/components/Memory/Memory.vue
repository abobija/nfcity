<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import { MemoryBlockClickEvent, MemoryBlockHoverEvent } from '@/components/MemoryBlock/MemoryBlockEvents';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import { MifareClassicMemory } from '@/models/MifareClassic';

defineProps<{
  memory: MifareClassicMemory;
}>();

defineEmits<{
  (e: 'blockHover', data: MemoryBlockHoverEvent): void;
  (e: 'blockClick', data: MemoryBlockClickEvent): void;
}>();
</script>

<template>
  <div class="memory component">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: memory.numberOfSectors })" :key="sectorOffset"
      :sector="memory.sectorAt(sectorOffset)" @block-hover="e => $emit('blockHover', e)"
      @block-click="e => $emit('blockClick', e)" />
  </div>
</template>
