<script setup lang="ts">
import { toHex } from '../../helpers';

defineProps<{
  offset: number,
  bytes: Uint8Array,
}>();
</script>

<template>
  <div :class="`block block-${offset}`">
    <ul class="bytes">
      <li class="byte" v-for="(byte, offset) in bytes" :key="offset">
        {{ toHex(byte) }}
      </li>
    </ul>
  </div>
</template>
