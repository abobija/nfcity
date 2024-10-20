<script setup lang="ts">
import MemoryViewer from "@/components/MemoryViewer/MemoryViewer.vue";
import MifareClassicBlock, { MifareClassicBlockType } from "@/models/MifareClassic/MifareClassicBlock";
import { hex } from "@/utils/helpers";

defineProps<{
  block: MifareClassicBlock;
}>();
</script>

<template>
  <section class="BlockInfoRenderer">
    <header>
      <p>
        <var>{{ MifareClassicBlockType[block.type] }}</var> block
        @ address <var>{{ hex(block.address) }}</var>
      </p>
    </header>
    <main>
      <MemoryViewer :block />
    </main>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@use '@/theme' as *;

.BlockInfoRenderer {
  font-size: .9rem;

  >main {
    margin-top: 1rem;
  }
}
</style>
