<script setup lang="ts">
import MemoryView from '@/components/MemoryViewer/MemoryView';
import MemoryViewer from '@/components/MemoryViewer/MemoryViewer.vue';
import { MifareClassicBlock, MifareClassicBlockType } from '@/models/MifareClassic';
import { hex } from '@/utils/helpers';
import { ref } from 'vue';

defineProps<{
  block: MifareClassicBlock;
}>();

const view = ref(MemoryView.Hexadecimal);
</script>

<template>
  <div class="block renderer component">
    <div class="header">
      Block
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Address</div>
        <div class="value">{{ hex(block.address) }}</div>
      </li>
      <li class="prop">
        <div class="name">Type</div>
        <div class="value">{{ MifareClassicBlockType[block.type] }}</div>
      </li>
      <li class="prop">
        <div class="name" title="Access Bits">Access</div>
        <div class="value">
          c1({{ block.accessBits.c1 }})
          c2({{ block.accessBits.c2 }})
          c3({{ block.accessBits.c3 }})
        </div>
      </li>
      <li class="prop">
        <div class="name">Content</div>
        <div class="value">
          <MemoryViewer :view :block @view-change="v => view = v" />
        </div>
      </li>
    </ul>
  </div>
</template>
