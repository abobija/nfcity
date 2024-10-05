<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryBlockGroup from '@/components/MemoryBlock/MemoryBlockGroup';
import emits from '@/components/MemoryBlock/events/MemoryBlockEvents';
import MemoryByteEvent from '@/components/MemoryBlock/events/MemoryByteEvent';
import { hex } from '@/helpers';
import {
  MifareClassicBlock,
  MifareClassicBlockType
} from '@/models/MifareClassic';
import { computed, ref } from 'vue';

const props = defineProps<{
  block: MifareClassicBlock;
  blockGroups: MemoryBlockGroup[];
}>();

const focusedByteIndex = ref<number | undefined>(undefined);

const classes = computed(() => ({
  empty: !props.block.loaded,
  undefined: props.block.type == MifareClassicBlockType.Undefined,
  trailer: props.block.type == MifareClassicBlockType.SectorTrailer,
  manufacturer: props.block.type == MifareClassicBlockType.Manufacturer,
  data: props.block.type == MifareClassicBlockType.Data,
  value: props.block.type == MifareClassicBlockType.Value,
}));

function byteIndex(index: number, blockGroup: MemoryBlockGroup) {
  return blockGroup.offset + index;
}

function makeEvent(blockGroup: MemoryBlockGroup, index: number): MemoryByteEvent {
  return MemoryByteEvent.from(
    props.block,
    blockGroup.origin,
    byteIndex(index, blockGroup),
    (state?: boolean) => {
      focusedByteIndex.value = (state ?? true) ? byteIndex(index, blockGroup) : undefined;
    }
  );
};
</script>

<template>
  <div class="memory-block component" :class="classes">
    <ul class="group" :class="blockGroup.class" v-for="blockGroup in props.blockGroups">
      <li class="byte" v-for="(_, index) in Array.from({ length: blockGroup.length })"
        :key="byteIndex(index, blockGroup)" :data-index="byteIndex(index, blockGroup)"
        :class="{ focused: focusedByteIndex == byteIndex(index, blockGroup) }"
        @mouseenter="emits.emit('byteMouseEnter', makeEvent(blockGroup, index))"
        @mouseleave="emits.emit('byteMouseLeave', makeEvent(blockGroup, index))"
        @click="emits.emit('byteMouseClick', makeEvent(blockGroup, index))">
        {{ block.loaded ? hex(block.data[byteIndex(index, blockGroup)]) : '..' }}
      </li>
    </ul>
  </div>
</template>
