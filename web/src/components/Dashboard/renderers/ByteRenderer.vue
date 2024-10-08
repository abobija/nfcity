<script setup lang="ts">
import TargetByte from '@/components/Dashboard/TargetByte';
import { hex } from '@/utils/helpers';

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
