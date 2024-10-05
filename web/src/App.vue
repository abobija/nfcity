<script setup lang="ts">
import '@/App.scss';
import Client from '@/comm/Client';
import Dashboard from '@/components/Dashboard/Dashboard.vue';
import { logger } from '@/Logger';
import { inject, ref, watch } from 'vue';
import { onClientReady } from './comm/hooks/ClientEventHooks';

enum AppState {
  Initialized = 0,
  Connecting,
  Connected,
}

const client = inject('client') as Client;
const state = ref<AppState>(AppState.Initialized);

watch(state, (newState, oldState) => {
  logger.verbose(
    'app state changed',
    'from', AppState[oldState],
    'to', AppState[newState]
  );
});

function connect() {
  state.value = AppState.Connecting;
  client.connect();
}

onClientReady(() => state.value = AppState.Connected);
</script>

<template>
  <div class="app">
    <div class="enter center-screen" v-if="state < AppState.Connected">
      <h1 class="title">nfcity</h1>
      <h2 class="subtitle">deep dive into NFC cards</h2>
      <button class="connect btn primary" @click="connect" :disabled="state == AppState.Connecting">
        connect
      </button>
      <div class="credits">
        made by <a href="https://github.com/abobija" target="_blank">ab</a>
      </div>
    </div>
    <Dashboard v-else />
  </div>
</template>
