<script setup lang="ts">
import { hex } from '../../helpers';
import { blockSize, PiccBlock } from '../../models/Picc';

defineProps<{
  block?: PiccBlock;
}>();
</script>

<template>
  <div class="block" :class="block === undefined && 'empty'">
    <ul class="bytes">
      <li :data-index="i" class="byte" v-for="(_, i) in Array.from({ length: blockSize })" :key="i">
        {{ block ? hex(block.bytes[i]) : '..' }}
      </li>
    </ul>
  </div>
</template>
