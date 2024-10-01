<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import './App.scss';
import Client from './communication/Client';
import PiccMessage, { isPiccMessage } from './communication/messages/dev/PiccMessage';
import PiccDashboard from './components/PiccDashboard/PiccDashboard.vue';
import { logger } from './Logger';
import MifareClassic from './models/MifareClassic';
import { PiccType } from './models/Picc';

const client = inject('client') as Client;
const connected = ref(false);

const picc = ref<MifareClassic | null>(null);

function setPicc(message: PiccMessage): void {
  let piccSupported = MifareClassic.isMifareClassic(message.picc);

  // TODO: Remove once other mifare classic cards are supported
  piccSupported &&= message.picc.type === PiccType.Mifare1K;

  if (!piccSupported) {
    logger.error('Unsupported PICC type', PiccType[message.picc.type]);
    client.disconnect();
    return;
  }

  picc.value = MifareClassic.from(message.picc);
}

function connect() {
  client.connect()
    .on('connect', () => connected.value = true)
    .on('disconnect', () => connected.value = false)
    .on('end', () => connected.value = false)
    .on('offline', () => connected.value = false)
    .on('close', () => connected.value = false)
    .on('deviceMessage', message => {
      if (isPiccMessage(message)) {
        setPicc(message);
      }
    });
}

watch(connected, connected => {
  if (!connected) {
    picc.value = null;
    return;
  }

  client.getPicc();
});
</script>

<template>
  <div class="app">
    <div class="enter center-screen" v-if="!connected">
      <h1 class="title">nfcity</h1>
      <h2 class="subtitle">deep dive into NFC cards</h2>
      <button class="connect btn primary" @click="connect">connect</button>
      <div class="credits">
        made by <a href="https://github.com/abobija" target="_blank">ab</a>
      </div>
    </div>
    <div class="center-screen" v-else-if="picc == null">
      waiting for picc...
    </div>
    <PiccDashboard :picc="picc" v-else />
  </div>
</template>
