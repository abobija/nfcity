<script setup lang="ts">
import PiccDashboard from './components/PiccDashboard/PiccDashboard.vue';
import Picc, { PiccState, PiccType } from './models/Picc';

const picc = {
  type: PiccType.Mifare1K,
  state: PiccState.Active,
  atqa: 0x4,
  sak: 0x8,
  uid: new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]),
} as Picc;
</script>

<template>
  <div class="app">
    <PiccDashboard :picc="picc" />
  </div>
</template>
