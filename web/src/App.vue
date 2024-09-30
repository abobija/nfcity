<script setup lang="ts">
import { inject, ref } from 'vue';
import ExampleComponent from './components/ExampleComponent.vue';
import Client from './communication/Client';
import Message from './communication/messages/Message';
import { isPiccStateChanged } from './communication/messages/PiccStateChanged';
import { u8ArrToHex } from './helpers';

const client = inject('client') as Client;
const connected = ref(false);

function connect() {
  client.connect()
    .on('connect', () => connected.value = true)
    .on('disconnect', () => connected.value = false)
    .on('end', () => connected.value = false)
    .on('offline', () => connected.value = false)
    .on('close', () => connected.value = false)
    .on('message', (message: Message) => {
      if (isPiccStateChanged(message)) {
        console.log(
          'picc',
          u8ArrToHex(message.picc.uid),
          'changed state from',
          message.old_state,
          'to',
          message.picc.state,
          'state'
        );
      }
    });
}
</script>

<template>
  <ExampleComponent :msg="client.rootTopic!" />

  <div class="card">
    <div v-if="!connected">
      <button type="button" @click="connect">connect</button>
    </div>
    <div v-else>
      <button type="button" @click="client.disconnect">disconnect</button>
    </div>
  </div>
</template>

<style scoped>
/* Add some styles here */
</style>
