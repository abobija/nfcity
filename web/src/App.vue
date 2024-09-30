<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import './App.scss';
import Client from './communication/Client';
import PiccDashboard from './components/PiccDashboard/PiccDashboard.vue';
import { logger } from './Logger';
import { MifareClassic } from './models/Picc';

const client = inject('client') as Client;
const connected = ref(false);

// const picc = ref<MifareClassic | null>(null);
const picc = ref<MifareClassic | null>(new MifareClassic());

function connect() {
  client.connect()
    .on('connect', () => connected.value = true)
    .on('disconnect', () => connected.value = false)
    .on('end', () => connected.value = false)
    .on('offline', () => connected.value = false)
    .on('close', () => connected.value = false);
}

watch(connected, connected => {
  if (!connected) {
    picc.value = null;
    return;
  }

  logger.warn('TODO: Fetch picc');
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
      picc fetching...
    </div>
    <PiccDashboard :picc="picc" v-else />
  </div>
</template>
