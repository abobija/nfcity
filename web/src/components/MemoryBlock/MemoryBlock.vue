<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryByte from '@/components/MemoryByte/MemoryByte.vue';
import {
  MifareClassicBlock,
  MifareClassicBlockGroupType,
  MifareClassicBlockType
} from '@/models/MifareClassic';
import { computed } from 'vue';

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

const groupClass: Map<MifareClassicBlockGroupType, string> = new Map([
  [MifareClassicBlockGroupType.Undefined, 'undefined'],

  // Trailer
  [MifareClassicBlockGroupType.KeyA, 'key key-a'],
  [MifareClassicBlockGroupType.AccessBits, 'access-bits'],
  [MifareClassicBlockGroupType.UserByte, 'user-byte'],
  [MifareClassicBlockGroupType.KeyB, 'key key-b'],

  // Value
  [MifareClassicBlockGroupType.Value, 'value'],
  [MifareClassicBlockGroupType.ValueInverted, 'value-inverted'],
  [MifareClassicBlockGroupType.Address, 'addr'],
  [MifareClassicBlockGroupType.AddressInverted, 'addr-inverted'],

  // Data
  [MifareClassicBlockGroupType.Data, 'data'],

  // Manufacturer
  [MifareClassicBlockGroupType.UID, 'uid'],
  [MifareClassicBlockGroupType.BCC, 'bcc'],
  [MifareClassicBlockGroupType.SAK, 'sak'],
  [MifareClassicBlockGroupType.ATQA, 'atqa'],
  [MifareClassicBlockGroupType.ManufacturerData, 'manufacturer'],
]);
</script>

<template>
  <div class="memory-block component" :class="classes">
    <ul class="memory-block-group" :class="groupClass.get(group.type)" v-for="group in block.blockGroups">
      <MemoryByte :group="group" :index="index" v-for="(_, index) in Array.from({ length: group.length })" />
    </ul>
  </div>
</template>
