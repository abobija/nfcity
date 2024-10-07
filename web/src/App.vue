<script setup lang="ts">
import '@/App.scss';
import Client from '@/comm/Client';
import { onClientEnd, onClientReady } from '@/comm/hooks/ClientEmitHooks';
import Dashboard from '@/components/Dashboard/Dashboard.vue';
import { inject, onMounted, ref, watch } from 'vue';
import { Logger } from './Logger';

enum AppState {
  Undefined = 0,
  Initialized,
  Connecting,
  Connected,
}

const logger = Logger.fromName('App');
const client = inject('client') as Client;
const state = ref<AppState>(AppState.Undefined);

watch(state, (newState, oldState) => {
  logger.debug(
    'state changed',
    'from', AppState[oldState],
    'to', AppState[newState]
  );
});

function connect() {
  state.value = AppState.Connecting;
  client.connect();
}

onMounted(() => state.value = AppState.Initialized);

onClientReady(() => state.value = AppState.Connected);

onClientEnd(() => state.value = AppState.Initialized);
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
