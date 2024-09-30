<script setup lang="ts">
import { inject, ref } from 'vue';
import PiccDashboard from './components/PiccDashboard/PiccDashboard.vue';
import Picc, { PiccState, PiccType } from './models/Picc';
import Client from './communication/Client';

const client = inject('client') as Client;
const connected = ref(false);

const picc = {
  type: PiccType.Mifare1K,
  state: PiccState.Active,
  atqa: 0x4,
  sak: 0x8,
  uid: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]),
} as Picc;

function connect() {
  client.connect()
    .on('connect', () => connected.value = true)
    .on('disconnect', () => connected.value = false)
    .on('end', () => connected.value = false)
    .on('offline', () => connected.value = false)
    .on('close', () => connected.value = false);
}
</script>

<template>
  <div class="app">
    <PiccDashboard :picc="picc" v-if="connected" />
    <div v-else>
      <button @click="connect" v-if="!connected">Connect</button>
    </div>
  </div>
</template>
