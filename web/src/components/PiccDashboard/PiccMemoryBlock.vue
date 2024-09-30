<script setup lang="ts">
import { hex } from '../../helpers';

defineProps<{
  offset: number,
  bytes: Uint8Array,
}>();
</script>

<template>
  <div :data-offset="offset" class="block">
    <ul class="bytes">
      <li :data-index="i" class="byte" v-for="(byte, i) in bytes" :key="i">
        {{ hex(byte) }}
      </li>
    </ul>
  </div>
</template>
