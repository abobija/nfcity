<script setup lang="ts">
import Client from '@/comm/Client';
import '@/components/Dashboard/Dashboard.scss';
import Memory from '@/components/Memory/Memory.vue';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import { hex } from '@/helpers';
import { logger } from '@/Logger';
import MifareClassic, { defaultKey } from '@/models/MifareClassic';
import { PiccType } from '@/models/Picc';
import { inject } from 'vue';

defineProps<{
  picc: MifareClassic;
}>();

const client = inject('client') as Client;

function onSectorClick(e: MemorySectorClickEvent) {
  const { sector } = e;

  if (!sector.isEmpty) {
    logger.verbose(`Sector ${sector.offset} is not empty. Skipping load.`);
    return;
  }

  client.readSector({
    offset: sector.offset,
    key: defaultKey,
  });
}

function onBlockClick(e: MemoryBlockClickEvent) {
  logger.debug(`Block clicked.`, e);
}
</script>

<template>
  <div class="dashboard">
    <div class="header">
      <div class="picc">
        <h1 class="type">{{ PiccType[picc.type] }}</h1>
        <ul class="metas">
          <li class="meta">
            <span class="name">UID</span>
            <span class="value">{{ hex(picc.uid) }}</span>
          </li>
          <li class="meta">
            <span class="name">ATQA</span>
            <span class="value">{{ hex(picc.atqa) }}</span>
          </li>
          <li class="meta">
            <span class="name">SAK</span>
            <span class="value">{{ hex(picc.sak) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="main">
      <div class="section">
        <Memory :picc="picc" @sector-click="onSectorClick" @block-click="onBlockClick" />
      </div>
      <div class="section">
        <div class="info-panel">
          Click on one of the sectors on the left to load its data.
        </div>
      </div>
    </div>
  </div>
</template>
