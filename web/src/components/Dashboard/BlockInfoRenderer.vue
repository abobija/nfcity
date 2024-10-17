<script setup lang="ts">
import MemoryViewer from "@/components/MemoryViewer/MemoryViewer.vue";
import { MifareClassicBlock, MifareClassicBlockType } from "@/models/MifareClassic";
import { bin, hex } from "@/utils/helpers";

defineProps<{
  block: MifareClassicBlock;
}>();
</script>

<template>
  <section class="BlockInfoRenderer">
    <header>
      <p>
        <var>{{ MifareClassicBlockType[block.type] }}</var> block
        at address <var>{{ hex(block.address) }}</var>
        with access bits <var>{{ bin(block.accessBitsCombo).slice(-3) }}</var>
      </p>
    </header>
    <main>
      <MemoryViewer :block />
    </main>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.BlockInfoRenderer {
  font-size: .9rem;

  >main {
    margin-top: 1rem;
  }
}
</style>
