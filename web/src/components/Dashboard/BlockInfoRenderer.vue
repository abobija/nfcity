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
        {{ MifareClassicBlockType[block.type] }} Block at address {{ hex(block.address) }}
      </p>
      <p>
        Access bits {{ bin(block.accessBitsCombo).slice(-3) }}
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
