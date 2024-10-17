<script setup lang="ts">
import onClientPing from "@/communication/composables/onClientPing";
import onClientPong from "@/communication/composables/onClientPong";
import onClientPongMissed from "@/communication/composables/onClientPongMissed";
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
  <section class="SystemInfo">
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
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.SystemInfo {
  display: flex;

  .ping {
    display: flex;
    justify-content: flex-end;

    >*:not(:first-child):not(:last-child) {
      margin: 0 0.3rem;
    }

    .status {
      margin-left: 0.3rem;
      display: inline-block;
      line-height: 0.5rem;

      &.undefined {
        color: color.adjust($color-fg, $lightness: -40%);
      }

      &.pinged {
        color: color.adjust($color-4, $lightness: -40%);
      }

      &.ponged {
        color: $color-3;
      }

      &.miss {
        color: color.adjust($color-5, $lightness: -20%);
      }
    }
  }
}
</style>
