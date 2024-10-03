<script setup lang="ts">
import Client from '@/comm/Client';
import { isPiccBlockDevMessage } from '@/comm/msgs/dev/PiccBlockDevMessage';
import { isPiccSectorDevMessage } from '@/comm/msgs/dev/PiccSectorDevMessage';
import '@/components/Dashboard/Dashboard.scss';
import Memory from '@/components/Memory/Memory.vue';
import memoryBlockEmits, {
  MemoryBlockByteEvent
} from '@/components/MemoryBlock/MemoryBlockEvents';
import { hex } from '@/helpers';
import onDeviceMessage from '@/hooks/onDeviceMessage';
import { logger } from '@/Logger';
import MifareClassic, { defaultKey, MifareClassicBlock } from '@/models/MifareClassic';
import { PiccType } from '@/models/Picc';
import { inject, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  picc: MifareClassic;
}>();

const client = inject('client') as Client;
const hoveringByteRef = ref<MemoryBlockByteEvent | undefined>(undefined);

function onBlockByteEnter(e: MemoryBlockByteEvent) {
  logger.debug('Block byte entered', e);
  hoveringByteRef.value = e;
}

function onBlockByteLeave(e: MemoryBlockByteEvent) {
  logger.verbose('Block byte left', e);
  hoveringByteRef.value = undefined;
}

function onBlockByteClick(e: MemoryBlockByteEvent) {
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

onMounted(() => {
  memoryBlockEmits.on('byteEnter', onBlockByteEnter);
  memoryBlockEmits.on('byteLeave', onBlockByteLeave);
  memoryBlockEmits.on('byteClick', onBlockByteClick);
});

onUnmounted(() => {
  memoryBlockEmits.off('byteEnter', onBlockByteEnter);
  memoryBlockEmits.off('byteLeave', onBlockByteLeave);
  memoryBlockEmits.off('byteClick', onBlockByteClick);
});

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
        <Memory :memory="picc.memory" />
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

          <div class="hovering" v-if="hoveringByteRef">
            <ul>
              <li>Sector {{ hoveringByteRef.sector.offset }}</li>
              <li v-if="hoveringByteRef.block">
                Block offset {{ hoveringByteRef.block.offset }},
                address {{ hoveringByteRef.block.address }} (0x{{ hex(hoveringByteRef.block.address) }})
              </li>
              <li>Byte {{ hoveringByteRef.byteIndex }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
