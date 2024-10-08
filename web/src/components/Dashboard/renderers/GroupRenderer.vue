<script setup lang="ts">
import MemoryView from '@/components/MemoryViewer/MemoryView';
import MemoryViewer from '@/components/MemoryViewer/MemoryViewer.vue';
import { MifareClassicBlockGroup, MifareClassicBlockGroupType } from '@/models/MifareClassic';
import { ref } from 'vue';

defineProps<{
  group: MifareClassicBlockGroup;
}>();

const view = ref(MemoryView.Hexadecimal);
</script>

<template>
  <div class="group renderer component">
    <div class="header">
      Group
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Type</div>
        <div class="value">{{ MifareClassicBlockGroupType[group.type] }}</div>
      </li>
      <li class="prop">
        <div class="name">Offset</div>
        <div class="value">{{ group.offset }}</div>
      </li>
      <li class="prop">
        <div class="name">Length</div>
        <div class="value">{{ group.length }}</div>
      </li>
      <li class="prop" v-if="group.type != MifareClassicBlockGroupType.Data">
        <div class="name">Content</div>
        <div class="value">
          <MemoryViewer :view :block="group.block" :offset="group.offset" :length="group.length"
            @view-change="v => view = v" />
        </div>
      </li>
    </ul>
  </div>
</template>
