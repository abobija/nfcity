<script setup lang="ts">
import { hex } from '../../helpers';

defineProps<{
  offset: number,
  bytes: Uint8Array,
}>();
</script>

<template>
  <div :class="`block block-${offset}`">
    <ul class="bytes">
      <li class="byte" v-for="(byte, offset) in bytes" :key="offset">
        {{ hex(byte) }}
      </li>
    </ul>
  </div>
</template>
