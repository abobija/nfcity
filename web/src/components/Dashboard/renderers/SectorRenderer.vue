<script setup lang="ts">
import { MifareClassicSector } from "@/models/MifareClassic";

defineProps<{
  sector: MifareClassicSector;
}>();
</script>

<template>
  <div class="sector renderer component">
    <div class="header">
      Sector
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Offset</div>
        <div class="value">{{ sector.offset }}</div>
      </li>
    </ul>
  </div>
</template>
