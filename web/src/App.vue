<script setup lang="ts">
import '@/App.scss';
import Client from '@/comm/Client';
import { onClientEnd, onClientReady } from '@/comm/hooks/ClientEmitHooks';
import ClientConfig from '@/components/ClientConfig/ClientConfig.vue';
import Dashboard from '@/components/Dashboard/Dashboard.vue';
import { useClientMaybe } from '@/hooks/useClient';
import { Logger } from '@/utils/Logger';
import { onMounted, ref, watch } from 'vue';
import { useClientStorage } from './hooks/useClientStorage';
import { ValidatedClientStorage } from './storage/ClientStorage';

enum AppState {
  Undefined = 0,
  Initialized,
  Connecting,
  Connected,
}

const logger = Logger.fromName('App');
const { client, updateClient } = useClientMaybe();
const clientStorage = useClientStorage();
const state = ref<AppState>(AppState.Undefined);

watch(state, (newState, oldState) => {
  logger.debug(
    'state changed',
    'from', AppState[oldState],
    'to', AppState[newState]
  );
});

onMounted(() => {
  if (clientStorage.value.rootTopic) {
    updateClient(Client.from(
      clientStorage.value.brokerUrl,
      clientStorage.value.rootTopic,
    ));
  }

  state.value = AppState.Initialized;
});

function onClientConfigSave(newStorage: ValidatedClientStorage) {
  clientStorage.value = newStorage;

  updateClient(Client.from(
    newStorage.brokerUrl,
    newStorage.rootTopic,
  ));
}

function connect() {
  state.value = AppState.Connecting;
  client.value?.connect();
}

onClientReady(() => state.value = AppState.Connected);

onClientEnd(() => state.value = AppState.Initialized);
</script>

<template>
  <div class="app">
    <div class="login center-screen" v-if="state < AppState.Connected">
      <h1 class="title">nfcity</h1>
      <h2 class="subtitle">deep dive into NFC cards</h2>
      <div class="enter" v-if="clientStorage">
        <div class="config" v-if="!clientStorage.rootTopic">
          <ClientConfig :client-storage="clientStorage" @save="onClientConfigSave" />
        </div>
        <div class="connect" v-else>
          <button class="btn primary connect" @click="connect" :disabled="state == AppState.Connecting">
            connect
          </button>
          <p class="broker">
            <span class="static">to</span>
            {{ client?.rootTopicMasked }}
          </p>
          <p>
            <button class="btn txt primary edit" @click="() => logger.info('not implemented')">change</button>
          </p>
        </div>
        <div class="footer">
          <div class="credits">
            made by <a href="https://github.com/abobija" target="_blank">ab</a>
          </div>
        </div>
      </div>
    </div>
    <Dashboard v-else />
  </div>
</template>
