<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import emits from '@/components/MemoryByte/events/MemoryByteEvents';
import { hex } from '@/helpers';
import { MifareClassicBlockGroup } from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryByteFocus from './MemoryByteFocus';
import '@/components/MemoryByte/MemoryByte.scss';

const props = defineProps<{
  group: MifareClassicBlockGroup;
  index: number; // Index of the byte within the block
  focus?: MemoryByteFocus;
}>();

const classes = computed(() => ({
  focused: props.focus?.index === props.index
    && props.focus?.group.block.hasSameAddressAs(props.group.block),
}));
</script>

<template>
  <li class="memory-byte component" :class="classes" :data-index="index"
    @mouseenter="emits.emit('mouseEnter', { index, group })" @mouseleave="emits.emit('mouseLeave', { index, group })"
    @click="emits.emit('mouseClick', { index, group })">
    {{ group.block.loaded ? hex(group.block.data[index]) : '..' }}
  </li>
</template>
