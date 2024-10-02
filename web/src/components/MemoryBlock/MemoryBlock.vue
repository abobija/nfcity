<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryBlockByteGroup from '@/components/MemoryBlock/MemoryBlockByteGroup';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import { hex } from '@/helpers';
import {
  MifareClassicBlock,
  MifareClassicDataBlock,
  MifareClassicManufacturerBlock,
  MifareClassicSectorTrailerBlock,
  MifareClassicValueBlock
} from '@/models/MifareClassic';
import { computed } from 'vue';

defineEmits<{
  (e: 'click', data: MemoryBlockClickEvent): void;
}>();

const props = defineProps<{
  block?: MifareClassicBlock;
  byteGroups?: MemoryBlockByteGroup[];
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
  return (byteGroup.dataOffset || 0) + index;
}
</script>

<template>
  <div class="block" :class="classes">
    <ul class="bytes">
      <ul class="group" :class="byteGroup.class || 'data'" v-for="byteGroup in (props.byteGroups || [{}])">
        <li class="byte"
          v-for="(_, index) in Array.from({ length: byteGroup.length || (MifareClassicBlock.size - (byteGroup.dataOffset || 0)) })"
          :key="byteIndex(index, byteGroup)" :data-index="byteIndex(index, byteGroup)"
          @click="$emit('click', { block, byteIndex: byteIndex(index, byteGroup) })">
          {{ block ? hex(block.data[byteIndex(index, byteGroup)]) : '..' }}
        </li>
      </ul>
    </ul>
  </div>
</template>
