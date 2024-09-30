<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue';
import Client from '../../communication/Client';
import { DeviceMessage } from '../../communication/messages/Message';
import { isPiccBlock } from '../../communication/messages/PiccBlockMessage';
import { hex } from '../../helpers';
import { logger } from '../../Logger';
import Picc, { numberOfSectors, PiccKeyType, PiccMemory, PiccType } from '../../models/Picc';
import './PiccDashboard.scss';
import PiccMemoryLayout from './PiccMemoryLayout.vue';

defineProps<{
  picc: Picc;
}>();

const memory = ref<PiccMemory>({
  sectors: new Map(
    Array.from({ length: numberOfSectors }).map((_, i) => [i, { blocks: new Map() }])
  )
});

const client = inject('client') as Client;

function readBlockDemo() {
  client.readBlock({
    address: 0,
    key_type: PiccKeyType.A,
    key: new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
  });
}

const deviceListener = (message: DeviceMessage) => {
  if (!isPiccBlock(message)) {
    return;
  }

  logger.info('Received block', message);
};

onMounted(() => client.on('deviceMessage', deviceListener));
onUnmounted(() => client.off('deviceMessage', deviceListener));
</script>

<template>
  <div class="picc-dashboard">
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

    <button @click="readBlockDemo">read block demo</button>

    <PiccMemoryLayout :memory="memory" />
  </div>
</template>
