<script setup lang="ts">
import {
  MifareClassicBlockGroup,
  MifareClassicBlockGroupType
} from "@/models/MifareClassic";
import BlockGroupFocus from "@Memory/components/BlockGroup/BlockGroupFocus";
import Byte from "@Memory/components/Byte/Byte.vue";
import { computed } from "vue";

const props = defineProps<{
  group: MifareClassicBlockGroup;
  focus?: BlockGroupFocus;
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

const key = computed(() => props.group.block.sector.key);
const permissions = computed(() => {
  if (!key.value) {
    return [];
  }

  return Object.fromEntries(new Map(
    props.group.allowedOperationsFor(key.value).map(op => [`data-access-${op}`, true])
  ));
});

const classes = computed(() => {
  const arr: string[] = [groupClass.get(props.group.type)!];

  if (props.focus?.group.isSameAs(props.group)) {
    arr.push('focused');
  }

  return arr;
});
</script>

<template>
  <ul class="BlockGroup" :class="classes" v-bind="permissions">
    <Byte :group="group" :index="group.offset + index" v-for="(_, index) in Array.from({ length: group.length })"
      :focus="focus?.byteFocus" />
  </ul>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.BlockGroup {
  display: flex;
  flex-direction: row;

  &:hover {
    background-color: color.adjust($color-bg, $lightness: +1%);
  }
}

.Block:not(.undefined) {
  .BlockGroup {
    &:not([data-access-read]) {
      text-decoration: line-through;
    }
  }
}
</style>
