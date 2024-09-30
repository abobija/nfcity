<script setup lang="ts">
import './PiccMemoryLayout.scss';
import Sector from './PiccMemorySector.vue';

// defineProps<{ msg: string }>();
</script>

<template>
  <div class="memory">
    <div class="layout">
      <Sector v-for="index in [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]" :key="index" :index="index" />
    </div>
  </div>
</template>
