<script setup lang="ts">
import '@/App.scss';
import Client from "@/comm/Client";
import onClientReady from "@/comm/composables/onClientReady";
import ClientConfig from "@/components/ClientConfig/ClientConfig.vue";
import Dashboard from "@/components/Dashboard/Dashboard.vue";
import { useClientMaybe } from "@/composables/useClient";
import useClientStorage, { isValidClientStorage, ValidClientStorage } from "@/composables/useClientStorage";
import makeLogger from "@/utils/Logger";
import { onMounted, ref, watch } from "vue";

const {
  VITE_APP_NAME,
  VITE_APP_DESCRIPTION,
  VITE_APP_AUTHOR,
  VITE_APP_AUTHOR_URL,
  VITE_APP_REPO,
  VITE_APP_REPO_TAG,
  VITE_APP_REPO_TAG_NAME,
  VITE_APP_LICENSE_NAME,
  VITE_APP_LICENSE_URL,
} = import.meta.env;

enum AppState {
  Undefined = 0,
  Initialized,
  Connecting,
  ClientReady,
  InDashboard,
}

const logger = makeLogger('App');
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

  if (newState == AppState.ClientReady && oldState < AppState.ClientReady) {
    state.value = AppState.InDashboard;
  }
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

onClientReady(() => {
  if (state.value < AppState.ClientReady) {
    state.value = AppState.ClientReady;
  }
});
</script>

<template>
  <div class="app">
    <div class="login full-screen center" v-if="state < AppState.InDashboard">
      <h1 class="title">{{ VITE_APP_NAME }}</h1>
      <h2 class="subtitle">{{ VITE_APP_DESCRIPTION }}</h2>
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
            <span>v</span>
            <a v-if="VITE_APP_REPO" :href="`${VITE_APP_REPO}/tree/${VITE_APP_REPO_TAG}`" target="_blank">
              {{ VITE_APP_REPO_TAG_NAME || VITE_APP_REPO_TAG }}
            </a>
            <span v-else>{{ VITE_APP_REPO_TAG_NAME || VITE_APP_REPO_TAG }}</span>
          </p>
          <p class="copyright">
            copyrigh 2024 <a :href="VITE_APP_AUTHOR_URL" target="_blank">{{ VITE_APP_AUTHOR }}</a>,
            <a :href="VITE_APP_LICENSE_URL" class="license" target="_blank">{{ VITE_APP_LICENSE_NAME }}</a>
          </p>
        </div>
      </div>
    </div>
    <Dashboard v-else />
  </div>
</template>
