<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import '@/components/MemorySector/MemorySector.scss';
import {
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { computed } from 'vue';

const props = defineProps<{
  sector: MifareClassicSector;
}>();

const classes = computed(() => ({
  empty: props.sector.isEmpty,
}));
</script>

<template>
  <div class="memory-sector component" :class="classes">
    <div class="meta">
      <span class="offset">{{ sector.offset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock :block="sector.blockAt(blockOffset)"
        v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocksInSector(sector.offset) })"
        :key="blockOffset" />
    </div>
  </div>
</template>
