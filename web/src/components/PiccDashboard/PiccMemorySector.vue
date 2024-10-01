<script setup lang="ts">
import MifareClassic from '../../models/MifareClassic';
import Block from './PiccMemoryBlock.vue';

defineProps<{
  picc: MifareClassic;
  sectorOffset: number;
}>();
</script>

<template>
  <div class="sector">
    <div class="blocks">
      <Block v-for="(_, blockOffset) in Array.from({ length: picc.memory.numberOfBlocks(sectorOffset) })"
        :key="blockOffset" :picc="picc" :sector-offset="sectorOffset" :block-offset="blockOffset"
        :data-offset="blockOffset" />
    </div>
  </div>
</template>
