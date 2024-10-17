<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

const component = useTemplateRef('component');
const element = computed(() => {
  return component.value?.getElementsByTagName('input')?.item(0)
    || component.value?.getElementsByTagName('textarea')?.item(0);
});
const placeholder = ref<string>();

function inputHasValue() {
  return !!element.value?.value;
};

function onInputChanged() {
  placeholder.value = !inputHasValue() ? undefined : element.value?.placeholder;
};

onMounted(() => {
  onInputChanged();
  element.value?.addEventListener('input', onInputChanged);
});

onUnmounted(() => element.value?.removeEventListener('input', onInputChanged));
</script>

<template>
  <div class="HoverablePlaceholder" ref="component">
    <slot></slot>
    <div v-if="placeholder" class="placeholder">
      {{ placeholder }}
    </div>
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.HoverablePlaceholder {
  position: relative;

  >.placeholder {
    position: absolute;
    top: -6px;
    left: 8px;
    font-size: .5rem;
    font-weight: 600;
    background: $color-bg;
    padding: 0 .3rem;
    color: color.adjust($color-fg, $lightness: -25%);
  }
}
</style>
