<script setup lang="ts">
import '@/components/MemoryBytesViewer/MemoryBytesViewer.scss';
import { hex } from '@/helpers';

defineProps<{
  bytes: Uint8Array;
}>();
</script>

<template>
  <div class="memory-bytes-viewer component">
    {{ hex(bytes) }}
  </div>
</template>
