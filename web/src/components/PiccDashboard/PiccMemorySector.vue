<script setup lang="ts">
import { computed, inject } from 'vue';
import Client from '../../communication/Client';
import { logger } from '../../Logger';
import MifareClassic, { defaultKey, MifareClassicMemory } from '../../models/MifareClassic';
import PiccMemoryBlock from './PiccMemoryBlock.vue';

const props = defineProps<{
  picc: MifareClassic;
  sectorOffset: number;
}>();

const empty = computed<Boolean>(() => props.picc.memory
  .sectors.get(props.sectorOffset)!.blocks.size <= 0
);

const client = inject('client') as Client;

function onSectorClick(offset: number) {
  if (!empty.value) {
    logger.debug(`Sector ${offset} is not empty. Skipping load.`);
    return;
  }

  client.readSector({
    offset,
    key: defaultKey,
  });
}
</script>

<template>
  <div class="sector" :class="empty && 'empty'" @click="onSectorClick(sectorOffset)">
    <div class="meta">
      <span class="offset">{{ sectorOffset }}</span>
    </div>
    <div class="blocks">
      <PiccMemoryBlock
        v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocks(sectorOffset) })"
        :key="blockOffset" :picc="picc" :sector-offset="sectorOffset" :block-offset="blockOffset"
        :data-offset="blockOffset" />
    </div>
  </div>
</template>
