<script setup lang="ts">
import { inject, ref } from 'vue';
import Client from '../../communication/Client';
import { DeviceMessage } from '../../communication/messages/Message';
import { isPiccStateChanged } from '../../communication/messages/PiccStateChangedMessage';
import { u8ArrToHex } from '../../helpers';
import { logger } from '../../Logger';
import { PiccKeyType } from '../../models/Picc';

const client = inject('client') as Client;
const connected = ref(false);

function connect() {
  client.connect()
    .on('connect', () => connected.value = true)
    .on('disconnect', () => connected.value = false)
    .on('end', () => connected.value = false)
    .on('offline', () => connected.value = false)
    .on('close', () => connected.value = false)
    .on('deviceMessage', (message: DeviceMessage) => {
      if (isPiccStateChanged(message)) {
        logger.info(
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

function readBlock() {
  client.readBlock({
    address: 0,
    key: Uint8Array.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    key_type: PiccKeyType.A,
  });
}

</script>


<template>
  <div class="card">
    <div v-if="!connected">
      <button type="button" @click="connect">connect</button>
    </div>
    <div v-else>
      <button type="button" @click="client.disconnect">disconnect</button>
      <button type="button" @click="readBlock">read block</button>
    </div>
  </div>
</template>
