<script setup lang="ts">
import vFocus from "@/directives/vFocus";
import { hex, isHex, removeWhitespace, unhexToArray } from "@/utils/helpers";
import ByteRepresentation, { byteRepresentationSingleChar } from "@Memory/ByteRepresentation";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  offset?: number;
  length?: number;
  autofocus?: boolean;
  resizable?: boolean;
  multiline?: boolean;
  readonly?: boolean;
  placeholder?: string;
}>();

const byteRepresentation = ByteRepresentation.Hexadecimal;
const modelBytes = defineModel<number[]>({ required: true });
const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? modelBytes.value.length - _offset.value);
const maxlength = ref<number>();
const bytesField = useTemplateRef('bytesField');
const bytesFieldValue = ref(hex(modelBytes.value.slice(_offset.value, _offset.value + _length.value)));

onMounted(() => maxlength.value = _length.value);

watch(bytesFieldValue, (newValue, oldValue) => {
  const newBytes = unhexToArray(newValue);

  if (maxlength.value !== undefined && newBytes.length > maxlength.value) {
    bytesFieldValue.value = oldValue;
    return;
  }

  modelBytes.value = newBytes;
});

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && props.multiline !== true) {
    e.preventDefault();
    return;
  }

  if (e.ctrlKey) {
    return;
  }

  if ([
    'ArrowLeft',
    'ArrowTop',
    'ArrowRight',
    'ArrowDown',
    'Space',
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

  const target = bytesField.value!;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  const newValue = bytesFieldValue.value.slice(0, start) + text + bytesFieldValue.value.slice(end);

  bytesFieldValue.value = newValue;
  e.preventDefault();
}
</script>

<template>
  <section class="BytesInput" :data-placeholder="placeholder" :class="{
    empty: bytesFieldValue.length === 0,
  }">
    <abbr class="byte-representation txt-unselectable" :title="ByteRepresentation[byteRepresentation]">
      {{ byteRepresentationSingleChar(byteRepresentation) }}
    </abbr>
    <textarea ref="bytesField" v-focus="autofocus === true" v-model="bytesFieldValue" spellcheck="false"
      :rows="multiline === true ? undefined : 1" :class="{
        readonly: readonly === true,
      }" :style="{
        resize: resizable === false ? 'none' : 'both',
      }" @keydown="onKeyDown" @paste="onPaste" name="bytes" :readonly="readonly" :placeholder></textarea>
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

  &:is([data-placeholder]):not(.empty) {
    &::after {
      content: attr(data-placeholder);
      position: absolute;
      top: -8px;
      left: 8px;
      font-size: .5rem;
      font-weight: 600;
      background: $color-bg;
      padding: 0 .3rem;
      color: color.adjust($color-fg, $lightness: -25%);
    }
  }
}
</style>
