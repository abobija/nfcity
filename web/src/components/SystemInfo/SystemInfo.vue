<script setup lang="ts">
import { onClientPing, onClientPong, onClientPongMissed } from '@/comm/hooks/ClientEventHooks';
import '@/components/MemoryBlock/MemoryBlock.scss';
import '@/components/SystemInfo/SystemInfo.scss';
import { ref } from 'vue';

enum PingState {
  Undefined,
  Pinged,
  Ponged,
  PongMissed,
}

const pingState = ref<PingState>(PingState.Undefined);
const pingLatency = ref<number | undefined>(undefined);

onClientPing(() => {
  if (pingState.value != PingState.PongMissed) {
    pingState.value = PingState.Pinged;
  }
});
onClientPong((e) => {
  pingState.value = PingState.Ponged;
  pingLatency.value = e.latency;
});
onClientPongMissed(() => {
  pingState.value = PingState.PongMissed;
  pingLatency.value = undefined;
});
</script>

<template>
  <div class="component system-info">
    <div class="ping">
      <span class="latency" v-if="pingLatency" title="Latency [ms]">
        {{ pingLatency }}
      </span>
      <span class="miss" v-if="pingState == PingState.PongMissed">
        miss
      </span>
      <Transition mode="out-in" :duration="100">
        <span class="status undefined" v-if="pingState == PingState.Undefined" title="Ping pong">
          &squf;
        </span>
        <span class="status pinged" v-else-if="pingState == PingState.Pinged" title="Ping sent">
          &squf;
        </span>
        <span class="status ponged" v-else-if="pingState == PingState.Ponged" title="Pong received">
          &squf;
        </span>
        <span class="status miss" v-else-if="pingState == PingState.PongMissed" title="Pong miss">
          &squf;
        </span>
      </Transition>
    </div>
  </div>
</template>
