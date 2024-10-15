<script setup lang="ts">
import vFocus from "@/directives/vFocus";
import { hex, isHex, removeWhitespace, unhexToArray } from "@/utils/helpers";
import ByteRepresentation, { byteRepresentationSingleChar } from "@Memory/ByteRepresentation";
import { ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  maxlength?: number; // max number of bytes (not chars!) that can be entered
  autofocus?: boolean;
  resizable?: boolean;
  multiline?: boolean;
  readonly?: boolean;
}>();

const byteRepresentation = ByteRepresentation.Hexadecimal;
const modelBytes = defineModel<number[]>({ required: true });
const bytesField = useTemplateRef('bytesField');
const bytesFieldValue = ref(hex(modelBytes.value));

watch(bytesFieldValue, (newValue, oldValue) => {
  const newBytes = unhexToArray(newValue);

  if (props.maxlength !== undefined && newBytes.length > props.maxlength) {
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
  <section class="BytesInput">
    <abbr class="byte-representation unselectable" :title="ByteRepresentation[byteRepresentation]">
      {{ byteRepresentationSingleChar(byteRepresentation) }}
    </abbr>
    <textarea ref="bytesField" v-focus="autofocus === true" v-model="bytesFieldValue" spellcheck="false"
      :rows="multiline === true ? undefined : 1" :class="{
        readonly: readonly === true,
      }" :style="{
        resize: resizable === false ? 'none' : 'both',
      }" @keydown="onKeyDown" @paste="onPaste" name="bytes" :readonly="readonly"></textarea>
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
