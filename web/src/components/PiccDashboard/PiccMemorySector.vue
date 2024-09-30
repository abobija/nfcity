<script setup lang="ts">
import { numberOfBlocks, PiccSector } from '../../models/Picc';
import Block from './PiccMemoryBlock.vue';

defineProps<{
  sector?: PiccSector;
}>();
</script>

<template>
  <div class="sector">
    <div class="blocks">
      <Block v-for="(_, offset) in Array.from({ length: numberOfBlocks })" :key="offset"
        :block="sector?.blocks.get(offset)" :data-offset="offset" />
    </div>
  </div>
</template>
