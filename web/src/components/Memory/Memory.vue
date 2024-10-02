<script setup lang="ts">
import '@/components/Memory/Memory.scss';
import MemorySector from '@/components/MemorySector/MemorySector.vue';
import MifareClassic from '@/models/MifareClassic';

defineProps<{
  picc: MifareClassic;
}>();
</script>

<template>
  <div class="memory">
    <MemorySector v-for="(_, sectorOffset) in Array.from({ length: picc.memory.numberOfSectors })" :key="sectorOffset"
      :picc="picc" :sectorOffset="sectorOffset" :data-offset="sectorOffset" />
  </div>
</template>
