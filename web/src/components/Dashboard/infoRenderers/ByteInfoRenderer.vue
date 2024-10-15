<script setup lang="ts">
import TargetByte from "@/components/Dashboard/TargetByte";
import { hex } from "@/utils/helpers";

defineProps<{
  byte: TargetByte;
}>();
</script>

<template>
  <section class="ByteInfoRenderer">
    <div class="header prop">
      <div class="name">Byte</div>
      <div class="value">{{ byte.index }}</div>
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Value</div>
        <div class="value">{{ hex(byte.group.block.data[byte.index]) }}</div>
      </li>
    </ul>
  </section>
</template>
