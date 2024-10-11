<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryBlockFocus from "@/components/MemoryBlock/MemoryBlockFocus";
import MemoryBlockGroup from "@/components/MemoryBlockGroup/MemoryBlockGroup.vue";
import {
  MifareClassicBlock,
  MifareClassicBlockType
} from "@/models/MifareClassic";
import { computed } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  focus?: MemoryBlockFocus;
}>();

const classes = computed(() => ({
  focused: props.focus?.block.hasSameAddressAs(props.block),
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
    <MemoryBlockGroup :group="group" v-for="group in block.blockGroups" :focus="focus?.groupFocus" />
  </div>
</template>
