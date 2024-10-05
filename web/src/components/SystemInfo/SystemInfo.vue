<script setup lang="ts">
import { onClientPing, onClientPong, onClientPongMissed } from '@/comm/hooks/ClientEventHooks';
import '@/components/MemoryBlock/MemoryBlock.scss';
import '@/components/SystemInfo/SystemInfo.scss';
import { ref } from 'vue';

enum PingPongState {
  Undefined,
  Pinged,
  Ponged,
  PongMissed,
}

const pingPongState = ref<PingPongState>(PingPongState.Undefined);
const pingPongLatency = ref<number | undefined>(undefined);

onClientPing(() => pingPongState.value = PingPongState.Pinged);
onClientPong((e) => {
  pingPongState.value = PingPongState.Ponged;
  pingPongLatency.value = e.latency;
});
onClientPongMissed(() => {
  pingPongState.value = PingPongState.PongMissed;
  pingPongLatency.value = undefined;
});
</script>

<template>
  <div class="component system-info">
    <div class="ping">
      <span class="latency" v-if="pingPongLatency" title="Latency [ms]">
        {{ pingPongLatency }}
      </span>
      <span class="miss" v-if="pingPongState == PingPongState.PongMissed">
        miss
      </span>
      <Transition mode="out-in" :duration="100">
        <span class="status undefined" v-if="pingPongState == PingPongState.Undefined" title="Ping pong">
          &squf;
        </span>
        <span class="status pinged" v-else-if="pingPongState == PingPongState.Pinged" title="Ping sent">
          &squf;
        </span>
        <span class="status ponged" v-else-if="pingPongState == PingPongState.Ponged" title="Pong received">
          &squf;
        </span>
        <span class="status miss" v-else-if="pingPongState == PingPongState.PongMissed" title="Pong missed">
          &squf;
        </span>
      </Transition>
    </div>
  </div>
</template>
