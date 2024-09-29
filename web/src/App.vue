<script setup lang="ts">
import { ref } from 'vue';
import ExampleComponent from './components/ExampleComponent.vue';
import mqtt, { MqttClient } from 'mqtt';

const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
const rootTopic = '/nfcity-7493/';
const devTopic = 'dev';
const webTopic = 'web';

let client: MqttClient | null = null;
const connected = ref(false);

function connect() {
  if (client != null) {
    return;
  }

  client = mqtt.connect(brokerUrl);

  client.on('error', error => {
    console.debug('error', error);
    connected.value = false;
  });

  client.on('connect', () => {
    console.debug('connected');

    const topic = rootTopic + devTopic;

    client!.subscribe(topic, { qos: 0 }, err => {
      if (err) {
        console.error('subscribe error', err);
        return;
      }

      console.debug('subscribed', topic);
    });

    connected.value = true;
  });

  client.on('reconnect', () => {
    console.debug('reconnect');
    connected.value = false;
  });

  client.on('close', () => {
    console.debug('close');
    connected.value = false;
  });

  client.on('disconnect', () => {
    console.debug('disconnected');
    connected.value = false;
  });

  client.on('offline', () => {
    console.debug('offline');
    connected.value = false;
  });

  client.on('end', () => {
    console.debug('end');
    connected.value = false;
  });

  client.on('message', function (topic, message) {
    console.debug('message', topic, message);
  });
}

function disconnect() {
  if (client == null) {
    return;
  }

  client.end(true);
  client = null;
}
</script>

<template>
  <ExampleComponent :msg="rootTopic" />

  <div class="card">
    <button type="button" @click="connect" v-if="!connected">connect</button>
    <button type="button" @click="disconnect" v-else>disconnect</button>
  </div>
</template>

<style scoped>
/* Add some styles here */
</style>
