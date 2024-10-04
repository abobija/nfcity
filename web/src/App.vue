<script setup lang="ts">
import '@/App.scss';
import Client from '@/comm/Client';
import Dashboard from '@/components/Dashboard/Dashboard.vue';
import { logger } from '@/Logger';
import MifareClassic from '@/models/MifareClassic';
import { PiccState, PiccType } from '@/models/Picc';
import { inject, ref, watch } from 'vue';
import { onClientDisconnect, onClientMessage, onClientReady } from './comm/hooks/ClientEventHooks';
import HelloDevMessage from './comm/msgs/dev/HelloDevMessage';
import PiccDevMessage from './comm/msgs/dev/PiccDevMessage';
import PiccStateChangedDevMessage from './comm/msgs/dev/PiccStateChangedDevMessage';
import GetPiccWebMessage from './comm/msgs/web/GetPiccWebMessage';

enum AppState {
  Disconnected = -1,
  Initialized = 0,
  Connecting,
  Connected,
  PiccFetching,
  PiccNotPresent,
  PiccRemoved,
  PiccPaired,
}

const client = inject('client') as Client;
const stateRef = ref<AppState>(AppState.Initialized);
const piccRef = ref<MifareClassic | null>(null);

watch(stateRef, (newState, oldState) => {
  logger.verbose('app state changed from', AppState[oldState], 'to', AppState[newState]);

  switch (newState) {
    case AppState.Disconnected:
    case AppState.Initialized:
    case AppState.Connecting: {
      piccRef.value = null;
    } break;
    case AppState.Connected: {
      stateRef.value = AppState.PiccFetching;
    } break;
    case AppState.PiccFetching: {
      client.send(GetPiccWebMessage.create());
    } break;
    case AppState.PiccNotPresent: {
      // do nothing, wait for user to put a card
    } break;
    case AppState.PiccRemoved: {
      // do nothing, wait for user to put the card back
    } break;
    case AppState.PiccPaired: {
      // do nothing, user is in dashboard
    } break;
  }
});

function connect() {
  stateRef.value = AppState.Connecting;
  client.connect();
}

onClientReady(() => stateRef.value = AppState.Connected);

onClientDisconnect(() => stateRef.value = AppState.Disconnected);

onClientMessage(e => {
  if (!HelloDevMessage.is(e.message)) {
    return;
  }

  stateRef.value = AppState.PiccFetching;
});

onClientMessage(e => {
  const { message } = e;

  if (!PiccDevMessage.is(message) && !PiccStateChangedDevMessage.is(message)) {
    return;
  }

  const { picc } = message;

  if (picc.type === PiccType.Undefined) {
    // ignore, device did not scanned a single picc yet
    return;
  }

  let supported = MifareClassic.dtoIsMifareClassic(picc);

  // TODO: Remove once other mifare classic cards are supported
  supported &&= picc.type === PiccType.Mifare1K;

  if (!supported) {
    logger.error('Unsupported PICC type', PiccType[picc.type]);
    client.disconnect();
    return;
  }

  piccRef.value = MifareClassic.fromDto(picc);

  if ([PiccState.Active, PiccState.ActiveH].includes(picc.state)) {
    stateRef.value = AppState.PiccPaired;
    return;
  }

  if (picc.state == PiccState.Idle) {
    if (PiccStateChangedDevMessage.is(message)
      && [PiccState.Active, PiccState.ActiveH].includes(message.old_state)) {
      stateRef.value = AppState.PiccRemoved;
      return;
    }

    stateRef.value = AppState.PiccNotPresent;
    return;
  }
});
</script>

<template>
  <div class="app">
    <div class="enter center-screen" v-if="stateRef < AppState.Connected">
      <h1 class="title">nfcity</h1>
      <h2 class="subtitle">deep dive into NFC cards</h2>
      <button class="connect btn primary" @click="connect" :disabled="stateRef == AppState.Connecting">
        connect
      </button>
      <div class="credits">
        made by <a href="https://github.com/abobija" target="_blank">ab</a>
      </div>
    </div>
    <div class="picc-waiter center-screen" v-else-if="stateRef < AppState.PiccPaired">
      <div v-if="stateRef == AppState.PiccFetching">
        <p class="message">checking for a card...</p>
      </div>
      <div v-else-if="stateRef == AppState.PiccNotPresent">
        <p class="message">put a card on the reader</p>
      </div>
      <div v-else-if="stateRef == AppState.PiccRemoved">
        <p class="message">card removed, put it back please</p>
      </div>
    </div>
    <Dashboard :picc="piccRef" v-else-if="piccRef instanceof MifareClassic" />
  </div>
</template>
