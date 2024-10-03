<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import { MemoryBlockByteClickEvent, MemoryBlockByteHoverEvent } from '@/components/MemoryBlock/MemoryBlockEvents';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import { MifareClassicMemory } from '@/models/MifareClassic';

defineProps<{
  memory: MifareClassicMemory;
}>();

defineEmits<{
  (e: 'blockByteHover', data: MemoryBlockByteHoverEvent): void;
  (e: 'blockByteClick', data: MemoryBlockByteClickEvent): void;
}>();
</script>

<template>
  <div class="memory component">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: memory.numberOfSectors })" :key="sectorOffset"
      :sector="memory.sectorAt(sectorOffset)" @block-byte-hover="e => $emit('blockByteHover', e)"
      @block-byte-click="e => $emit('blockByteClick', e)" />
  </div>
</template>
