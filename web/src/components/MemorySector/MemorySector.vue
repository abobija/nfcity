<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import MifareClassic, { MifareClassicMemory } from '@/models/MifareClassic';
import { computed } from 'vue';

const props = defineProps<{
  picc: MifareClassic;
  sectorOffset: number;
}>();

defineEmits<{
  (e: 'click', data: MemorySectorClickEvent): void;
}>();

const isEmpty = computed<Boolean>(() => props.picc.memory
  .sectors.get(props.sectorOffset)!.blocks.size <= 0
);
</script>

<template>
  <div class="sector" :class="isEmpty && 'empty'" @click="$emit('click', { sectorOffset, isEmpty })">
    <div class="meta">
      <span class="offset">{{ sectorOffset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocks(sectorOffset) })"
        :key="blockOffset" :picc="picc" :sector-offset="sectorOffset" :block-offset="blockOffset"
        :data-offset="blockOffset" />
    </div>
  </div>
</template>
