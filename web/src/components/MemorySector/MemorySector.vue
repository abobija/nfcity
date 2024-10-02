<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import {
  MifareClassicBlock,
  MifareClassicManufacturerBlock,
  MifareClassicMemory,
  MifareClassicSector,
  MifareClassicSectorTrailerBlock,
  MifareClassicValueBlock
} from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryBlockByteGroup from '../MemoryBlock/MemoryBlockByteGroup';

const props = defineProps<{
  sector: MifareClassicSector;
}>();

const emit = defineEmits<{
  (e: 'click', data: MemorySectorClickEvent): void;
  (e: 'blockClick', data: MemoryBlockClickEvent): void;
}>();

const onBlockClick = (e: MemoryBlockClickEvent) => emit('blockClick', e);

const classes = computed(() => ({
  empty: props.sector.isEmpty,
}));

function blockByteGroups(block?: MifareClassicBlock): MemoryBlockByteGroup[] | undefined {
  if (block instanceof MifareClassicSectorTrailerBlock) {
    return [
      { dataOffset: 0, length: 6, class: 'key-a' },
      { dataOffset: 6, length: 4, class: 'access-bits' },
      { dataOffset: 10, length: 6, class: 'key-b' },
    ];
  }

  if (block instanceof MifareClassicManufacturerBlock) {
    const { uid } = props.sector.memory.picc;

    return [
      { dataOffset: 0, length: uid.length, class: 'uid' },
      { dataOffset: uid.length, length: 1, class: 'bcc' },
      { dataOffset: uid.length + 1, length: 1, class: 'sak' },
      { dataOffset: uid.length + 2, length: 2, class: 'atqa' },
      { dataOffset: uid.length + 4, class: 'manufacturer' },
    ];
  }

  if (block instanceof MifareClassicValueBlock) {
    return [
      { dataOffset: 0, length: 4, class: 'value' },
      { dataOffset: 4, length: 4, class: 'value-inverted' },
      { dataOffset: 8, length: 4, class: 'value' },
      { dataOffset: 12, length: 1, class: 'addr' },
      { dataOffset: 13, length: 1, class: 'addr-inverted' },
      { dataOffset: 14, length: 1, class: 'addr' },
      { dataOffset: 15, length: 1, class: 'addr-inverted' },
    ];
  }
}
</script>

<template>
  <div class="sector" :class="classes" @click="$emit('click', { sector })">
    <div class="meta">
      <span class="offset">{{ sector.offset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocks(sector.offset) })"
        :key="blockOffset" :block="sector.blockAt(blockOffset)"
        :byte-groups="blockByteGroups(sector.blockAt(blockOffset))" @click="onBlockClick" />
    </div>
  </div>
</template>
