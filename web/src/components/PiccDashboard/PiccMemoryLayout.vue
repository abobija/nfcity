<script setup lang="ts">
import MifareClassic from '../../models/MifareClassic';
import './PiccMemoryLayout.scss';
import Sector from './PiccMemorySector.vue';

defineProps<{
  picc: MifareClassic;
}>();
</script>

<template>
  <div class="memory">
    <div class="layout">
      <Sector v-for="(_, sectorOffset) in Array.from({ length: picc.memory.numberOfSectors })" :key="sectorOffset"
        :picc="picc" :sectorOffset="sectorOffset" :data-offset="sectorOffset" />
    </div>
  </div>
</template>
