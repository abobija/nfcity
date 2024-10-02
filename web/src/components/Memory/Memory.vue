<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import MifareClassic from '@/models/MifareClassic';

defineProps<{
  picc: MifareClassic;
}>();

const emits = defineEmits<{
  (e: 'sectorClick', data: MemorySectorClickEvent): void;
}>();

const onSectorClick = (e: MemorySectorClickEvent) => emits('sectorClick', e);
</script>

<template>
  <div class="memory">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: picc.memory.numberOfSectors })" :key="sectorOffset"
      :picc="picc" :sectorOffset="sectorOffset" :data-offset="sectorOffset" @click="onSectorClick" />
  </div>
</template>
