<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryBlockByteGroup from '@/components/MemoryBlock/MemoryBlockByteGroup';
import emits, { MemoryBlockByteEvent } from '@/components/MemoryBlock/MemoryBlockEvents';
import { hex } from '@/helpers';
import {
  MifareClassicBlock,
  MifareClassicDataBlock,
  MifareClassicManufacturerBlock,
  MifareClassicSector,
  MifareClassicSectorTrailerBlock,
  MifareClassicValueBlock
} from '@/models/MifareClassic';
import { computed } from 'vue';

const props = defineProps<{
  sector: MifareClassicSector;
  block?: MifareClassicBlock;
  byteGroups: MemoryBlockByteGroup[];
}>();

const isEmpty = computed<Boolean>(() => props.block === undefined);

const classes = computed(() => ({
  empty: isEmpty.value,
  trailer: props.block instanceof MifareClassicSectorTrailerBlock,
  manufacturer: props.block instanceof MifareClassicManufacturerBlock,
  data: props.block instanceof MifareClassicDataBlock,
  value: props.block instanceof MifareClassicValueBlock,
}));

function byteIndex(index: number, byteGroup: MemoryBlockByteGroup) {
  return (byteGroup.offset || 0) + index;
}

const eventFrom = (byteGroup: MemoryBlockByteGroup, index: number): MemoryBlockByteEvent => ({
  sector: props.sector,
  block: props.block,
  byteGroup: byteGroup.origin,
  byteIndex: byteIndex(index, byteGroup),
});
</script>

<template>
  <div class="block component" :class="classes">
    <ul class="bytes">
      <ul class="group" :class="byteGroup.class || 'data'" v-for="byteGroup in props.byteGroups">
        <li class="byte"
          v-for="(_, index) in Array.from({ length: byteGroup.length || (MifareClassicBlock.size - (byteGroup.offset || 0)) })"
          :key="byteIndex(index, byteGroup)" :data-index="byteIndex(index, byteGroup)"
          @mouseenter="emits.emit('byteEnter', eventFrom(byteGroup, index))"
          @mouseleave="emits.emit('byteLeave', eventFrom(byteGroup, index))"
          @click="emits.emit('byteClick', eventFrom(byteGroup, index))">
          {{ block ? hex(block.data[byteIndex(index, byteGroup)]) : '..' }}
        </li>
      </ul>
    </ul>
  </div>
</template>
