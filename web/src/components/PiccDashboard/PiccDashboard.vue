<script setup lang="ts">
import { inject } from 'vue';
import Client from '../../communication/Client';
import { isPiccBlockMessage } from '../../communication/messages/dev/PiccBlockMessage';
import { hex } from '../../helpers';
import onDeviceMessage from '../../hooks/onDeviceMessage';
import { logger } from '../../Logger';
import MifareClassic from '../../models/MifareClassic';
import { PiccKeyType, PiccType } from '../../models/Picc';
import './PiccDashboard.scss';
import PiccMemoryLayout from './PiccMemoryLayout.vue';

defineProps<{
  picc: MifareClassic;
}>();

const client = inject('client') as Client;

function readBlockDemo() {
  client.readBlock({
    address: 0,
    key_type: PiccKeyType.A,
    key: new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
  });
}

onDeviceMessage(message => {
  if (!isPiccBlockMessage(message)) {
    return;
  }

  logger.info('Received block', message);
});
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

    <button class="btn primary" @click="readBlockDemo">read block demo</button>

    <PiccMemoryLayout :picc="picc" />
  </div>
</template>
