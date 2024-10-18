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
  ['Undefined', 'undefined'],

  // Trailer
  ['KeyA', 'key key-a'],
  ['AccessBits', 'access-bits'],
  ['UserByte', 'user-byte'],
  ['KeyB', 'key key-b'],

  // Value
  ['Value', 'value'],
  ['ValueInverted', 'value-inverted'],
  ['Address', 'addr'],
  ['AddressInverted', 'addr-inverted'],

  // Data
  ['Data', 'data'],

  // Manufacturer
  ['UID', 'uid'],
  ['BCC', 'bcc'],
  ['SAK', 'sak'],
  ['ATQA', 'atqa'],
  ['ManufacturerData', 'manufacturer'],
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
