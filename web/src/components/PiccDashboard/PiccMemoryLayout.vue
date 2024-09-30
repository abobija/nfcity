<script setup lang="ts">
import { numberOfSectors, PiccMemory } from '../../models/Picc';
import './PiccMemoryLayout.scss';
import Sector from './PiccMemorySector.vue';

defineProps<{
  memory: PiccMemory;
}>();
</script>

<template>
  <div class="memory">
    <div class="layout">
      <Sector v-for="(_, offset) in Array.from({ length: numberOfSectors })" :key="offset"
        :sector="memory.sectors.get(offset)" :data-offset="offset" />
    </div>
  </div>
</template>
