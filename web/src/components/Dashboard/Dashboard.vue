<script setup lang="ts">
import Client from '@/comm/Client';
import { isPiccBlockDevMessage } from '@/comm/msgs/dev/PiccBlockDevMessage';
import { isPiccSectorDevMessage } from '@/comm/msgs/dev/PiccSectorDevMessage';
import '@/components/Dashboard/Dashboard.scss';
import Memory from '@/components/Memory/Memory.vue';
import { MemoryBlockByteClickEvent, MemoryBlockByteHoverEvent } from '@/components/MemoryBlock/MemoryBlockEvents';
import { hex } from '@/helpers';
import onDeviceMessage from '@/hooks/onDeviceMessage';
import { logger } from '@/Logger';
import MifareClassic, { defaultKey, MifareClassicBlock } from '@/models/MifareClassic';
import { PiccType } from '@/models/Picc';
import { inject } from 'vue';

const props = defineProps<{
  picc: MifareClassic;
}>();

const client = inject('client') as Client;

function onBlockByteHover(e: MemoryBlockByteHoverEvent) {
  logger.verbose('Block byte hovered', e);
}

function onBlockByteClick(e: MemoryBlockByteClickEvent) {
  logger.verbose('Block byte clicked', e);

  const sector = e.sector;

  if (!sector.isEmpty) {
    logger.verbose(`Sector ${sector.offset} is not empty. Skipping load.`);
    return;
  }

  client.readSector({
    offset: sector.offset,
    key: defaultKey,
  });
}

onDeviceMessage(message => {
  if (!isPiccBlockDevMessage(message)) {
    return;
  }

  logger.warning('Unhandled reception of single block', message.block);
});

onDeviceMessage(message => {
  if (!isPiccSectorDevMessage(message)) {
    return;
  }

  props.picc.memory.updateSector(message.blocks);
});
</script>

<template>
  <div class="dashboard component">
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
        <Memory :memory="picc.memory" @block-byte-hover="onBlockByteHover" @block-byte-click="onBlockByteClick" />
      </div>
      <div class="section">
        <div class="info-panel">
          <p class="memory">
            {{ PiccType[picc.type] }} has
            {{ picc.memory.blockDistribution.flatMap(d => `${d[0]} sectors with ${d[1]} blocks`).join(' and ') }}
            which is a total of
            {{ picc.memory.blockDistribution.reduce((acc, [blocks, count]) => acc + blocks * count, 0) }}
            blocks.
            Each block is {{ MifareClassicBlock.size }} bytes long, which results in a total of
            {{ picc.memory.size }} bytes of memory.
          </p>

          <Transition appear>
            <p class="hint" v-if="picc.memory.isEmpty">
              Click on one of the sectors on the left to load its data. </p>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
