<script setup lang="ts">
import { randomBytes } from '../../helpers';
import Block from './PiccMemoryBlock.vue';

defineProps<{
  index: number;
}>();
</script>

<template>
  <div :class="`sector sector-${index}`">
    <div class="blocks">
      <Block :bytes="randomBytes(16)" v-for="offset in [3, 2, 1, 0]" :key="offset" :offset="offset" />
    </div>
  </div>
</template>
