<script setup lang="ts">
import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { keyTypeName } from "@/models/Picc";

defineProps<{
  sector: MifareClassicSector;
}>();
</script>

<template>
  <section class="SectorStatusBarItem">
    <abbr class="name" title="Sector">S</abbr>
    <ul>
      <li>
        <abbr title="Sector index / offset">
          {{ sector.offset }}
        </abbr>
      </li>
      <li v-if="sector.key" title="Key used in Sector authentication">
        Key {{ keyTypeName(sector.key.type) }}
      </li>
    </ul>
  </section>
</template>
