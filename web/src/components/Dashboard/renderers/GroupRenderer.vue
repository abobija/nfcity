<script setup lang="ts">
import MemoryBytesViewer from '@/components/MemoryBytesViewer/MemoryBytesViewer.vue';
import { MifareClassicBlockGroup, MifareClassicBlockGroupType } from '@/models/MifareClassic';

defineProps<{
  group: MifareClassicBlockGroup;
}>();
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
          <MemoryBytesViewer :bytes="group.data()" />
        </div>
      </li>
    </ul>
  </div>
</template>
