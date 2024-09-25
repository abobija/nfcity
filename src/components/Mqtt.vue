<script setup lang="ts">
import { ref } from 'vue';
import mqtt from 'mqtt';

defineProps<{ msg: string }>();

let client = null;
const connected = ref(false);

function connect() {
  if(client !== null) {
    return;
  }

  client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
    username: 'emqx',
    password: 'public',
  });

  client.on('error', function(error) {
    connected.value = false;
    console.log('error', error);
  });

  client.on('connect', function() {
    connected.value = true;
    console.log('(re)connected');
  });

  client.on('reconnect', function() {
    connected.value = false;
    console.log('reconnect');
  });
  
  client.on('close', function() {
    connected.value = false;
    console.log('close');
  });

  client.on('disconnect', function() {
    connected.value = false;
    console.log('disconnected');
  });

  client.on('offline', function() {
    connected.value = false;
    console.log('offline');
  });

  client.on('end', function() {
    connected.value = false;
    console.log('end');
  });

  client.on('message', function(topic, message) {
    console.log('message', topic, message.toString());
  });
}

function disconnect() {
  if(client !== null) {
    client.end(true);
    client = null;
  }
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="connect" v-if="!connected">connect</button>
    <button type="button" @click="disconnect" v-else>disconnect</button>
  </div>
</template>

<style scoped>
/* Add some styles here */
</style>
