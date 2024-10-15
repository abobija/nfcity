<script setup lang="ts">
import Client from "@/communication/Client";
import onClientReady from "@/communication/composables/onClientReady";
import ClientConfig from "@/components/ClientConfig/ClientConfig.vue";
import Dashboard from "@/components/Dashboard/Dashboard.vue";
import { useClientMaybe } from "@/composables/useClient";
import useClientStorage, { isValidClientStorage, ValidClientStorage } from "@/composables/useClientStorage";
import makeLogger from "@/utils/Logger";
import { onMounted, ref, watch } from "vue";
import wns from "./WNS";
import { assert } from "./utils/helpers";

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
    updateClient(new Client(
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

  updateClient(new Client(
    clientStorageProposal.brokerUrl,
    clientStorageProposal.rootTopic,
  ));
}

function connect() {
  if (client.value?.connected === true) {
    state.value = AppState.ClientReady;
  } else {
    state.value = AppState.Connecting;
    client.value?.connect();
  }
}

onClientReady(() => {
  if (state.value < AppState.ClientReady) {
    state.value = AppState.ClientReady;
  }

  assert(client.value);

  wns.client = client.value;
});
</script>

<template>
  <div class="App">
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
    <Dashboard v-else @exit="() => state = AppState.Initialized" />
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.App {
  .login {
    color: $color-4;

    .title {
      font-size: 3rem;
      font-weight: 600;
      color: $color-1
    }

    .subtitle {
      margin-top: 1rem;
      font-size: 1.2rem;
      font-weight: 400;
      color: color.adjust($color-1, $lightness: -25%);
    }

    .enter {
      margin-top: 4rem;

      >.connect {
        display: flex;
        flex-direction: column;
        align-items: center;

        .btn.connect {
          margin-bottom: 2rem;
        }

        .broker {
          color: $color-5;
          font-size: .7rem;

          .static {
            opacity: .5;
          }
        }

        .btn.edit {
          font-size: .6rem;
        }
      }
    }

    .footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 4rem;

      .version {
        opacity: .7;
        font-size: .6rem;
      }

      .copyright {
        opacity: .5;
        font-size: .5rem;
      }

      &>p:not(:last-child) {
        margin-bottom: .2rem;
      }
    }
  }
}
</style>
