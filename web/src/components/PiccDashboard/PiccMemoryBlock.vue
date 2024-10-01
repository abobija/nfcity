<script setup lang="ts">
import { computed } from 'vue';
import { hex } from '../../helpers';
import MifareClassic from '../../models/MifareClassic';

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
      <li :data-index="i" class="byte" v-for="(_, i) in Array.from({ length: picc.blockSize })" :key="i">
        {{ block ? hex(block.bytes[i]) : '..' }}
      </li>
    </ul>
  </div>
</template>
