<script setup lang="ts">
import { hex } from '@/helpers';
import TargetByte from '../TargetByte';

defineProps<{
  byte: TargetByte;
}>();
</script>

<template>
  <div class="byte renderer component">
    <div class="header">
      Byte
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Index</div>
        <div class="value">{{ byte.index }}</div>
      </li>
      <li class="prop">
        <div class="name">Value</div>
        <div class="value">{{ hex(byte.group.block.data[byte.index]) }}</div>
      </li>
    </ul>
  </div>
</template>
