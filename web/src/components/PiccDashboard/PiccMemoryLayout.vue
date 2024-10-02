<script setup lang="ts">
import '@/components/PiccDashboard/PiccMemoryLayout.scss';
import PiccMemorySector from '@/components/PiccDashboard/PiccMemorySector.vue';
import MifareClassic from '@/models/MifareClassic';

defineProps<{
  picc: MifareClassic;
}>();
</script>

<template>
  <div class="memory">
    <div class="layout">
      <PiccMemorySector v-for="(_, sectorOffset) in Array.from({ length: picc.memory.numberOfSectors })"
        :key="sectorOffset" :picc="picc" :sectorOffset="sectorOffset" :data-offset="sectorOffset" />
    </div>
  </div>
</template>
