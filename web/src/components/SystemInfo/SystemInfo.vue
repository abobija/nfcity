<script setup lang="ts">
import onClientPing from "@/communication/composables/onClientPing";
import onClientPong from "@/communication/composables/onClientPong";
import onClientPongMissed from "@/communication/composables/onClientPongMissed";
import '@/components/MemoryBlock/MemoryBlock.scss';
import '@/components/SystemInfo/SystemInfo.scss';
import useClient from "@/composables/useClient";
import { ref } from "vue";

enum PingState {
  Undefined,
  PingSent,
  PongReceived,
  PongMiss,
}

const { client } = useClient();
const pingState = ref<PingState>(PingState.Undefined);
const pingLatency = ref<number | undefined>(undefined);

onClientPing(() => {
  if (pingState.value != PingState.PongMiss) {
    pingState.value = PingState.PingSent;
  }
});
onClientPong((e) => {
  pingState.value = PingState.PongReceived;
  pingLatency.value = e.latency;
});
onClientPongMissed(() => {
  pingState.value = PingState.PongMiss;
  pingLatency.value = undefined;
});
</script>

<template>
  <div class="component system-info">
    <div class="ping">
      <span class="root-topic">
        {{ client.rootTopicMasked }} @ {{ client.brokerUrl.hostname }}
      </span>
      <Transition mode="out-in" :duration="75">
        <span class="status undefined" v-if="pingState == PingState.Undefined" title="ping pong">
          &squf;
        </span>
        <span class="status pinged" v-else-if="pingState == PingState.PingSent" title="ping sent">
          &squf;
        </span>
        <span class="status ponged" v-else-if="pingState == PingState.PongReceived" title="pong received">
          &squf;
        </span>
        <span class="status miss" v-else-if="pingState == PingState.PongMiss" title="pong miss">
          &squf;
        </span>
      </Transition>
      <span class="miss" v-if="pingState == PingState.PongMiss">
        miss
      </span>
      <span class="latency" v-if="pingLatency" title="ping-pong latency [ms]">
        {{ pingLatency }}
      </span>
    </div>
  </div>
</template>
