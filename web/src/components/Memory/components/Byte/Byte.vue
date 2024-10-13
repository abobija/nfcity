<script setup lang="ts">
import '@/components/Memory/components/Byte/Byte.scss';
import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import { hex } from "@/utils/helpers";
import { computed } from "vue";
import ByteFocus from './ByteFocus';
import byteEmits from './byteEmits';

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
  <li class="Byte" :class="classes" :data-index="index" @mouseenter="byteEmits.emit('mouseEnter', { index, group })"
    @mouseleave="byteEmits.emit('mouseLeave', { index, group })"
    @click="byteEmits.emit('mouseClick', { index, group })">
    {{ group.block.loaded ? hex(group.block.data[index]) : '..' }}
  </li>
</template>
