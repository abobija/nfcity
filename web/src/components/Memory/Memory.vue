<script setup lang="ts">
import { MifareClassicMemory } from "@/models/MifareClassic";
import MemoryFocus from "@Memory/MemoryFocus";
import Sector from "@Memory/components/Sector/Sector.vue";
import { computed } from "vue";

defineProps<{
  memory: MifareClassicMemory;
  focus?: MemoryFocus;
}>();

const classes = computed(() => ({
  focused: focus !== undefined,
}));
</script>

<template>
  <div class="Memory" :class="classes">
    <Sector v-for="(sector, sectorOffset) in memory.sectors" :key="sectorOffset" :sector :focus="focus?.sectorFocus" />
  </div>
</template>

<style lang="scss">
.Memory {
  display: flex;
  flex-direction: column-reverse;
}
</style>
