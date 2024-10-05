<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import {
  MifareClassicBlock,
  MifareClassicBlockType
} from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryBlockGroup from '../MemoryBlockGroup/MemoryBlockGroup.vue';

const props = defineProps<{
  block: MifareClassicBlock;
}>();

const classes = computed(() => ({
  empty: !props.block.loaded,
  undefined: props.block.type == MifareClassicBlockType.Undefined,
  trailer: props.block.type == MifareClassicBlockType.SectorTrailer,
  manufacturer: props.block.type == MifareClassicBlockType.Manufacturer,
  data: props.block.type == MifareClassicBlockType.Data,
  value: props.block.type == MifareClassicBlockType.Value,
}));
</script>

<template>
  <div class="memory-block component" :class="classes">
    <MemoryBlockGroup :group="group" v-for="group in block.blockGroups" />
  </div>
</template>
