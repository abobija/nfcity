<script setup lang="ts">
import { inject, ref, watch } from 'vue';
import './App.scss';
import Client from './communication/Client';
import { isHelloMessage } from './communication/messages/dev/HelloMessage';
import { isPiccMessage } from './communication/messages/dev/PiccMessage';
import { isPiccStateChangedMessage } from './communication/messages/dev/PiccStateChangedMessage';
import PiccDashboard from './components/PiccDashboard/PiccDashboard.vue';
import onDeviceMessage from './hooks/onDeviceMessage';
import { logger } from './Logger';
import MifareClassic from './models/MifareClassic';
import { PiccState, PiccType } from './models/Picc';

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
const state = ref<AppState>(AppState.Initialized);
const picc = ref<MifareClassic | null>(null);

function connect() {
  state.value = AppState.Connecting;

  client.connect()
    .on('ready', () => state.value = AppState.Connected)
    .on('disconnect', () => state.value = AppState.Disconnected);
}

onDeviceMessage(message => {
  if (!isHelloMessage(message)) {
    return;
  }

  state.value = AppState.PiccFetching;
});

onDeviceMessage(message => {
  if (!isPiccMessage(message) && !isPiccStateChangedMessage(message)) {
    return;
  }

  const _picc = message.picc;

  if (_picc.type === PiccType.Undefined) {
    // ignore, device did not scanned a single picc yet
    return;
  }

  let supported = MifareClassic.isMifareClassic(_picc);

  // TODO: Remove once other mifare classic cards are supported
  supported &&= _picc.type === PiccType.Mifare1K;

  if (!supported) {
    logger.error('Unsupported PICC type', PiccType[_picc.type]);
    client.disconnect();
    return;
  }

  picc.value = MifareClassic.from(_picc);

  if ([PiccState.Active, PiccState.ActiveH].includes(_picc.state)) {
    state.value = AppState.PiccPaired;
    return;
  }

  if (_picc.state == PiccState.Idle) {
    if (isPiccStateChangedMessage(message)
      && [PiccState.Active, PiccState.ActiveH].includes(message.old_state)) {
      state.value = AppState.PiccRemoved;
      return;
    }

    state.value = AppState.PiccNotPresent;
    return;
  }
});

watch(state, (newState, oldState) => {
  logger.verbose('app state changed from', AppState[oldState], 'to', AppState[newState]);

  switch (newState) {
    case AppState.Disconnected:
    case AppState.Initialized:
    case AppState.Connecting: {
      picc.value = null;
    } break;
    case AppState.Connected: {
      state.value = AppState.PiccFetching;
    } break;
    case AppState.PiccFetching: {
      client.getPicc();
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
</script>

<template>
  <div class="app">
    <div class="enter center-screen" v-if="state < AppState.Connected">
      <h1 class="title">nfcity</h1>
      <h2 class="subtitle">deep dive into NFC cards</h2>
      <button class="connect btn primary" @click="connect">connect</button>
      <div class="credits">
        made by <a href="https://github.com/abobija" target="_blank">ab</a>
      </div>
    </div>
    <div class="picc-waiter center-screen" v-else-if="state < AppState.PiccPaired">
      <div v-if="state == AppState.PiccFetching">
        <p class="message">checking for a card...</p>
      </div>
      <div v-else-if="state == AppState.PiccNotPresent">
        <p class="message">put a card on the reader</p>
      </div>
      <div v-else-if="state == AppState.PiccRemoved">
        <p class="message">card removed, put it back please</p>
      </div>
    </div>
    <PiccDashboard :picc="picc!" v-else />
  </div>
</template>
