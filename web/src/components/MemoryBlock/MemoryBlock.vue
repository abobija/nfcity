<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryBlockByteGroup from '@/components/MemoryBlock/MemoryBlockByteGroup';
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
  byteGroups: MemoryBlockByteGroup[];
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

function byteIndex(index: number, byteGroup: MemoryBlockByteGroup) {
  return byteGroup.offset + index;
}

function makeEvent(byteGroup: MemoryBlockByteGroup, index: number): MemoryByteEvent {
  return MemoryByteEvent.from(
    props.block,
    byteGroup.origin,
    byteIndex(index, byteGroup),
    (state?: boolean) => {
      focusedByteIndex.value = (state ?? true) ? byteIndex(index, byteGroup) : undefined;
    }
  );
};
</script>

<template>
  <div class="memory-block component" :class="classes">
    <ul class="bytes">
      <ul class="group" :class="byteGroup.class" v-for="byteGroup in props.byteGroups">
        <li class="byte" v-for="(_, index) in Array.from({ length: byteGroup.length })"
          :key="byteIndex(index, byteGroup)" :data-index="byteIndex(index, byteGroup)"
          :class="{ focused: focusedByteIndex == byteIndex(index, byteGroup) }"
          @mouseenter="emits.emit('byteMouseEnter', makeEvent(byteGroup, index))"
          @mouseleave="emits.emit('byteMouseLeave', makeEvent(byteGroup, index))"
          @click="emits.emit('byteMouseClick', makeEvent(byteGroup, index))">
          {{ block.loaded ? hex(block.data[byteIndex(index, byteGroup)]) : '..' }}
        </li>
      </ul>
    </ul>
  </div>
</template>
