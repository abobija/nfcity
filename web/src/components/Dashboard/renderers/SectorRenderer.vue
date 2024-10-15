<script setup lang="ts">
import { MifareClassicSector } from "@/models/MifareClassic";
import { keyTypeName } from "@/models/Picc";

defineProps<{
  sector: MifareClassicSector;
}>();
</script>

<template>
  <div class="sector renderer component">
    <div class="header prop">
      <div class="name">Sector</div>
      <div class="value">{{ sector.offset }}</div>
    </div>
    <ul class="props">
      <li class="prop" v-if="sector.key">
        <div class="name">Key type</div>
        <div class="value">{{ keyTypeName(sector.key.type) }}</div>
      </li>
    </ul>
  </div>
</template>
