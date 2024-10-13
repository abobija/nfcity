<script setup lang="ts">
import { MifareClassicSector } from "@/models/MifareClassic";
import { keyTypeName } from "@/models/Picc";
import { computed } from "vue";

const props = defineProps<{
  sector: MifareClassicSector;
}>();

const sectorOffset = computed(() => props.sector.memory.offsetOfSector(props.sector));
</script>

<template>
  <div class="sector renderer component">
    <div class="header">
      Sector
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Offset</div>
        <div class="value">{{ sectorOffset }}</div>
      </li>
      <li class="prop" v-if="sector.key">
        <div class="name">Key</div>
        <div class="value">{{ keyTypeName(sector.key.type) }}</div>
      </li>
    </ul>
  </div>
</template>
