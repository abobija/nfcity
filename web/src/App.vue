<script setup lang="ts">
import '@/App.scss';
import Client from '@/comm/Client';
import { onClientEnd, onClientReady } from '@/comm/hooks/ClientEmitHooks';
import ClientConfig from '@/components/ClientConfig/ClientConfig.vue';
import Dashboard from '@/components/Dashboard/Dashboard.vue';
import { useClientMaybe } from '@/hooks/useClient';
import { useClientStorage } from '@/hooks/useClientStorage';
import { isValidClientStorage, ValidClientStorage } from '@/storage/ClientStorage';
import { Logger } from '@/utils/Logger';
import { onMounted, ref, watch } from 'vue';

const {
  VITE_APP_VERSION,
  VITE_APP_GITHUB_REPO_PATH,
} = import.meta.env;

enum AppState {
  Undefined = 0,
  Initialized,
  Connecting,
  Connected,
}

const logger = Logger.fromName('App');
const { client, updateClient } = useClientMaybe();
const { clientStorage, updateClientStorage } = useClientStorage();
const state = ref<AppState>(AppState.Undefined);
const configClient = ref(false);

watch(state, (newState, oldState) => {
  logger.debug(
    'state changed',
    'from', AppState[oldState],
    'to', AppState[newState]
  );
});

onMounted(() => {
  if (isValidClientStorage(clientStorage.value)) {
    updateClient(Client.from(
      clientStorage.value.brokerUrl,
      clientStorage.value.rootTopic,
    ));
  } else {
    configClient.value = true;
  }

  state.value = AppState.Initialized;
});

watch(clientStorage, (newClientStorage) => {
  if (isValidClientStorage(newClientStorage)) {
    configClient.value = false;
  }
});

function onClientConfigSave(clientStorageProposal: ValidClientStorage) {
  updateClientStorage(clientStorageProposal);

  updateClient(Client.from(
    clientStorageProposal.brokerUrl,
    clientStorageProposal.rootTopic,
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
        <Transition mode="out-in" :duration="75">
          <div class="config" v-if="configClient">
            <ClientConfig :client-storage="clientStorage" @save="onClientConfigSave"
              @cancel="() => configClient = false" :cancelable="isValidClientStorage(clientStorage)" />
          </div>
          <div class="connect" v-else-if="client">
            <button class="btn primary connect" @click="connect" :disabled="state == AppState.Connecting">
              connect
            </button>
            <p class="broker">
              <span class="static">to</span>
              {{ client.rootTopicMasked }}
              <span class="static">@</span>
              {{ client.brokerUrl.hostname }}
            </p>
            <p>
              <button class="btn txt secondary edit" @click="() => configClient = true">change</button>
            </p>
          </div>
        </Transition>
        <div class="footer">
          <p class="version">
            <a :href="`https://github.com/abobija/nfcity/${VITE_APP_GITHUB_REPO_PATH}`" target="_blank">
              v{{ VITE_APP_VERSION }}
            </a>
          </p>
          <p class="credits">
            by <a href="https://github.com/abobija" target="_blank">ab</a>
          </p>
        </div>
      </div>
    </div>
    <Dashboard v-else />
  </div>
</template>
