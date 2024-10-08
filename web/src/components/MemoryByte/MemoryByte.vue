<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import memoryByteEmits from '@/components/MemoryByte/events/MemoryByteEmits';
import '@/components/MemoryByte/MemoryByte.scss';
import MemoryByteFocus from '@/components/MemoryByte/MemoryByteFocus';
import { MifareClassicBlockGroup } from '@/models/MifareClassic';
import { hex } from '@/utils/helpers';
import { computed } from 'vue';

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
    @mouseenter="memoryByteEmits.emit('mouseEnter', { index, group })"
    @mouseleave="memoryByteEmits.emit('mouseLeave', { index, group })"
    @click="memoryByteEmits.emit('mouseClick', { index, group })">
    {{ group.block.loaded ? hex(group.block.data[index]) : '..' }}
  </li>
</template>
