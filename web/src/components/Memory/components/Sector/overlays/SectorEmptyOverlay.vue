<script setup lang="ts">
defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <div class="memory-sector-overlay empty component" @click="$emit('click')">
    <p>This sector has not been loaded</p>
    <p>Click to unlock</p>
  </div>
</template>
