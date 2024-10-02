<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import MifareClassic from '@/models/MifareClassic';

defineProps<{
  picc: MifareClassic;
}>();

const emit = defineEmits<{
  (e: 'sectorClick', data: MemorySectorClickEvent): void;
  (e: 'blockClick', data: MemoryBlockClickEvent): void;
}>();

const onSectorClick = (e: MemorySectorClickEvent) => emit('sectorClick', e);
const onBlockClick = (e: MemoryBlockClickEvent) => emit('blockClick', e);
</script>

<template>
  <div class="memory">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: picc.memory.numberOfSectors })" :key="sectorOffset"
      :picc="picc" :sectorOffset="sectorOffset" :data-offset="sectorOffset" @click="onSectorClick"
      @block-click="onBlockClick" />
  </div>
</template>
