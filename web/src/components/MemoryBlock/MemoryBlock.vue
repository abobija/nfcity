<script setup lang="ts">
import '@/components/MemoryBlock/MemoryBlock.scss';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import { hex } from '@/helpers';
import MifareClassic, { MifareClassicMemory } from '@/models/MifareClassic';
import { computed } from 'vue';

defineEmits<{
  (e: 'click', data: MemoryBlockClickEvent): void;
}>();

const props = defineProps<{
  picc: MifareClassic;
  sectorOffset: number;
  blockOffset: number;
}>();

const block = computed(() => props
  .picc.memory
  .sectors.get(props.sectorOffset)
  ?.blocks.get(props.blockOffset)
);
</script>

<template>
  <div class="block" :class="block === undefined && 'empty'">
    <ul class="bytes">
      <li :data-index="i" class="byte" v-for="(_, i) in Array.from({ length: MifareClassicMemory.blockSize })" :key="i"
        @click="$emit('click', { sectorOffset, blockOffset, byteIndex: i })">
        {{ block ? hex(block.data[i]) : '..' }}
      </li>
    </ul>
  </div>
</template>
