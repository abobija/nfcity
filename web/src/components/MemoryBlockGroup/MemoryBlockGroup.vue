<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryByte from '@/components/MemoryByte/MemoryByte.vue';
import {
  MifareClassicBlockGroup,
  MifareClassicBlockGroupType
} from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryBlockGroupFocus from './MemoryBlockGroupFocus';

const props = defineProps<{
  group: MifareClassicBlockGroup;
  focus?: MemoryBlockGroupFocus;
}>();

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

const classes = computed(() => {
  const arr: string[] = [groupClass.get(props.group.type)!];

  if (props.focus?.group.hasSameTypeAs(props.group)) {
    arr.push('focused');
  }

  return arr;
});
</script>

<template>
  <ul class="memory-block-group component" :class="classes">
    <MemoryByte :group="group" :index="group.offset + index" v-for="(_, index) in Array.from({ length: group.length })"
      :focus="focus?.byteFocus" />
  </ul>
</template>
