<script setup lang="ts">
import { hex, hex2arr, isHex, removeWhitespace } from '@/utils/helpers';
import { onMounted, ref, useTemplateRef, watch } from 'vue';

const bytes = defineModel<Uint8Array>({ required: true });
const maxlength = ref<number>();
const value = ref<string>(hex(bytes.value, ''));
const field = useTemplateRef('field');

watch(value, v => bytes.value = hex2arr(removeWhitespace(v)));

onMounted(() => {
  maxlength.value = bytes.value.length * 2;
  field.value?.focus();
});

function validateKey(e: KeyboardEvent) {
  if (e.key.length !== 1 || !isHex(e.key)) {
    e.preventDefault();
  }
}
</script>

<template>
  <div class="memory-edit-field component">
    <textarea class="field" ref="field" v-model="value" @keypress="validateKey" :maxlength
      spellcheck="false"></textarea>
  </div>
</template>
