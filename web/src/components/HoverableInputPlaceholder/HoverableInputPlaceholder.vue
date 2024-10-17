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
  <div class="HoverableInputPlaceholder" ref="component">
    <slot></slot>
    <Transition>
      <div v-if="placeholder" class="placeholder" :key="placeholder">
        {{ placeholder }}
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.HoverableInputPlaceholder {
  position: relative;

  >.placeholder {
    position: absolute;
    font-size: .5rem;
    top: -7px;
    left: 8px;
    font-weight: 600;
    background-color: $color-bg;
    padding: 0 .3rem;
    color: color.adjust($color-fg, $lightness: -25%);
  }

  .v-enter-from,
  .v-leave-to {
    transform: scale(0.5) rotateY(180deg);
    opacity: 0;
  }

  .v-enter-active,
  .v-leave-active {
    transition: transform .3s, opacity .3s;
  }

  .v-enter-to,
  .v-leave-from {
    transform: scale(1) rotateY(0);
    opacity: 1;
  }
}
</style>
