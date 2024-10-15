<script setup lang="ts">
import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import { hex } from "@/utils/helpers";
import ByteFocus from "@Memory/components/Byte/ByteFocus";
import byteEmits from "@Memory/components/Byte/byteEmits";
import { computed } from "vue";
import ByteEvent from "./events/ByteEvent";

const props = defineProps<{
  group: MifareClassicBlockGroup;
  index: number; // Index of the byte within the block
  focus?: ByteFocus;
}>();

const classes = computed(() => ({
  focused: props.focus?.index === props.index
    && props.focus?.group.block.hasSameAddressAs(props.group.block),
}));
</script>

<template>
  <li class="Byte txt-unselectable" :class="classes" :data-index="index"
    @mouseenter="byteEmits.emit('mouseEnter', new ByteEvent(index, group))"
    @mouseleave="byteEmits.emit('mouseLeave', new ByteEvent(index, group))"
    @click="byteEmits.emit('mouseClick', new ByteEvent(index, group))">
    {{ group.block.loaded ? hex(group.block.data[index]) : '..' }}
  </li>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.Byte {
  cursor: pointer;
  font-size: 0.8rem;
  border-style: dashed;
  border-width: 0px 1px 1px 0px;
  border-color: color.adjust($color-bg, $lightness: +5%);
  padding: 0.25rem;
  transition: border-color .2s ease-in-out;

  &.focused {
    animation: byte-glows .5s infinite alternate;
    z-index: 1;
  }

  &:hover,
  &.focused {
    background-color: color.adjust($color-bg, $lightness: +5%);
    font-weight: 600;
  }
}

@keyframes byte-glows {
  $color: color.adjust($color-4, $lightness: -60%);

  0%,
  100% {
    box-shadow: none;
  }

  50% {
    box-shadow: 0 0 .6rem color.adjust($color, $lightness: +10%);
  }
}
</style>
