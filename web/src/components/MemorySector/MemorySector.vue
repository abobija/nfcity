<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import MifareClassic, { MifareClassicMemory } from '@/models/MifareClassic';
import { computed } from 'vue';

const props = defineProps<{
  picc: MifareClassic;
  sectorOffset: number;
}>();

const emit = defineEmits<{
  (e: 'click', data: MemorySectorClickEvent): void;
  (e: 'blockClick', data: MemoryBlockClickEvent): void;
}>();

const isEmpty = computed<Boolean>(() => props.picc.memory
  .sectors.get(props.sectorOffset)!.blocks.size <= 0
);

const onBlockClick = (e: MemoryBlockClickEvent) => emit('blockClick', e);
</script>

<template>
  <div class="sector" :class="isEmpty && 'empty'" @click="$emit('click', { sectorOffset, isEmpty })">
    <div class="meta">
      <span class="offset">{{ sectorOffset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocks(sectorOffset) })"
        :key="blockOffset" :picc="picc" :sector-offset="sectorOffset" :block-offset="blockOffset"
        :data-offset="blockOffset" @click="onBlockClick" />
    </div>
  </div>
</template>
