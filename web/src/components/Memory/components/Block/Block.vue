<script setup lang="ts">
import '@/components/Memory/components/Block/Block.scss';
import BlockFocus from "@/components/Memory/components/Block/BlockFocus";
import BlockGroup from "@/components/Memory/components/BlockGroup/BlockGroup.vue";
import {
  MifareClassicBlock,
  MifareClassicBlockType
} from "@/models/MifareClassic";
import { computed } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  focus?: BlockFocus;
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
  <div class="Block" :class="classes">
    <BlockGroup :group="group" v-for="group in block.blockGroups" :focus="focus?.groupFocus" />
  </div>
</template>
