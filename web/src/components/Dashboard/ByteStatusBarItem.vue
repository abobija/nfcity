<script setup lang="ts">
import TargetByte from "@/components/Dashboard/TargetByte";
import { hex } from "@/utils/helpers";

defineProps<{
  byte: TargetByte;
}>();
</script>

<template>
  <section class="ByteStatusBarItem">
    <abbr class="name" title="Byte">B</abbr>
    <ul>
      <li>
        <abbr title="Byte index">
          [{{ byte.index }}]
        </abbr>
      </li>
      <li title="Byte value">
        {{ hex(byte.group.block.data[byte.index]) }}
      </li>
    </ul>
  </section>
</template>
