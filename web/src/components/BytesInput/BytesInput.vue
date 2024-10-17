<script setup lang="ts">
import vFocus from "@/directives/vFocus";
import { arraysAreEqual, assert, hex, isHex, removeWhitespace, unhexToArray } from "@/utils/helpers";
import ByteRepresentation, { byteRepresentationSingleChar } from "@Memory/ByteRepresentation";
import { computed, ref, useTemplateRef, watch } from "vue";
import HoverablePlaceholder from "../HoverablePlaceholder/HoverablePlaceholder.vue";

const props = defineProps<{
  offset?: number;
  length?: number;
  autofocus?: boolean;
  resizable?: boolean;
  multiline?: boolean;
  readonly?: boolean;
  placeholder?: string;
  disabled?: boolean;
}>();

const byteRepresentation = ByteRepresentation.Hexadecimal;
const modelBytes = defineModel<number[]>({ required: true });
const modelBytesOrigin = ref(Array.from(modelBytes.value));
const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? modelBytesOrigin.value.length - _offset.value);
const maxlength = ref<number>(_length.value);
const bytesField = useTemplateRef('field');
const bytesFieldValue = ref(hex(modelBytesOrigin.value.slice(_offset.value, _offset.value + _length.value)));

watch(bytesFieldValue, (newValue, oldValue) => {
  const newBytes = unhexToArray(newValue);

  if (maxlength.value !== undefined && newBytes.length > maxlength.value) {
    bytesFieldValue.value = oldValue;
    return;
  }

  const newModelBytes = [
    ...modelBytesOrigin.value.slice(0, _offset.value),
    ...newBytes,
    ...modelBytesOrigin.value.slice(_offset.value + _length.value),
  ];

  if (arraysAreEqual(newModelBytes, modelBytes.value)) {
    return;
  }

  modelBytes.value = newModelBytes;
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    if (props.multiline !== true || modelBytes.value.length >= maxlength.value) {
      e.preventDefault();

      if (props.multiline !== true) {
        bytesField.value?.closest('form')?.requestSubmit();
      }
    }

    return;
  }

  if (e.ctrlKey) {
    return;
  }

  if (e.code === 'Space') {
    if (modelBytes.value.length >= maxlength.value) {
      e.preventDefault();
    }

    return;
  }

  if ([
    'Tab',
    'ArrowLeft',
    'ArrowTop',
    'ArrowRight',
    'ArrowDown',
    'Backspace',
    'Delete',
  ].includes(e.code)) {
    return;
  }

  if (e.key.length !== 1 || !isHex(e.key)) {
    e.preventDefault();
    return;
  }
}

function onPaste(e: ClipboardEvent) {
  let text = e.clipboardData?.getData('text');

  if (text === undefined) {
    e.preventDefault();
    return;
  }

  text = removeWhitespace(text);

  if (!text.length || !isHex(text)) {
    e.preventDefault();
    return;
  }

  assert(bytesField.value, 'bytes field not found');

  const target = bytesField.value;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const newValue = bytesFieldValue.value.slice(0, start) + text + bytesFieldValue.value.slice(end);

  bytesFieldValue.value = newValue;
  e.preventDefault();
}
</script>

<template>
  <section class="BytesInput" :data-placeholder="placeholder">
    <abbr class="byte-representation txt-unselectable" :title="ByteRepresentation[byteRepresentation]">
      {{ byteRepresentationSingleChar(byteRepresentation) }}
    </abbr>
    <HoverablePlaceholder>
      <textarea ref="field" v-focus="autofocus === true" v-model="bytesFieldValue" spellcheck="false"
        :rows="multiline === true ? undefined : 1" :class="{
          readonly: readonly === true,
        }" :style="{
        resize: resizable === false ? 'none' : 'both',
      }" @keydown="onKeyDown" @paste="onPaste" name="bytes" :readonly="readonly" :placeholder :disabled></textarea>
    </HoverablePlaceholder>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.BytesInput {
  position: relative;
  display: inline-block;
  vertical-align: top;
  font-weight: normal;
  line-height: normal;

  textarea {
    display: inline-block;
    padding: .3rem .4rem;
  }

  .byte-representation {
    position: absolute;
    top: .1rem;
    right: .2rem;
    text-decoration: none;
    border-style: solid;
    border-color: color.adjust($color-bg, $lightness: +20%);
    font-size: .5rem;
    font-weight: 600;
    color: color.adjust($color-bg, $lightness: +40%);
  }
}
</style>
