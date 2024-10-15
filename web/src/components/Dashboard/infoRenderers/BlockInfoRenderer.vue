<script setup lang="ts">
import { MifareClassicBlock, MifareClassicBlockType } from "@/models/MifareClassic";
import { hex } from "@/utils/helpers";

defineProps<{
  block: MifareClassicBlock;
}>();
</script>

<template>
  <div class="BlockInfoRenderer">
    <div class="header prop">
      <div class="name">Block</div>
      <div class="value">{{ hex(block.address) }}</div>
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Type</div>
        <div class="value">{{ MifareClassicBlockType[block.type] }}</div>
      </li>
      <li class="prop">
        <div class="name" title="Access Bits">Access</div>
        <div class="value">
          Bits {{ block.accessBits.c1 }}{{ block.accessBits.c2 }}{{ block.accessBits.c3 }}
        </div>
      </li>
    </ul>
  </div>
</template>
