<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

const component = useTemplateRef('component');
const element = computed(() => {
  return component.value?.getElementsByTagName('input')?.item(0)
    || component.value?.getElementsByTagName('textarea')?.item(0);
});
const placeholder = ref<string>();
const observer = ref<MutationObserver>();

function inputHasValue() {
  return !!element.value?.value;
};

function onInputChanged() {
  placeholder.value = !inputHasValue() ? undefined : element.value?.placeholder;
};

onMounted(() => {
  onInputChanged();

  element.value?.addEventListener('input', onInputChanged);
  element.value?.addEventListener('propertychange', onInputChanged);

  if (element.value) {
    observer.value = new MutationObserver(() => onInputChanged());
    observer.value.observe(element.value, {
      attributes: true,
      attributeFilter: ['placeholder'],
    });
  }
});

onUnmounted(() => {
  element.value?.removeEventListener('input', onInputChanged);
  observer.value?.disconnect();
});
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
    font-size: .5rem;
    top: -7px;
    left: 8px;
    font-weight: 600;
    background: $color-bg;
    padding: 0 .3rem;
    color: color.adjust($color-fg, $lightness: -25%);
  }
}
</style>
