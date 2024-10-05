<script setup lang="ts">
import '@/components/Dashboard/TargetByteRenderer.scss';
import '@/components/MemoryBlock/MemoryBlock.scss';
import { hex } from '@/helpers';
import { MifareClassicBlockGroup } from '@/models/MifareClassic';

defineProps<{
  group: MifareClassicBlockGroup;
}>();
</script>

<template>
  <div class="default-group-renderer component">
    <p>{{ hex(group.data()) }}</p>
  </div>
</template>
