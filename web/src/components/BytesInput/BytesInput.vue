<script setup lang="ts">
import vFocus from "@/directives/vFocus";
import { hex, isHex, removeWhitespace, unhexToArray } from '@/utils/helpers';
import { ref, watch } from 'vue';

const props = defineProps<{
  maxlength?: number; // max number of bytes (not chars!) that can be entered
  autofocus?: boolean;
}>();

const modelBytes = defineModel<number[]>({ required: true });
const fieldValue = ref(hex(modelBytes.value));

// TODO:
// optimize to validate onkeydown instead of validating whole value on every change,
// but if value is not going to be big, it's fine like this
watch(fieldValue, (newValue, oldValue) => {
  const newValueWithoutWS = removeWhitespace(newValue);

  if (!isHex(newValueWithoutWS)) {
    fieldValue.value = oldValue;
    return;
  }

  const newBytes = unhexToArray(newValueWithoutWS);

  if (props.maxlength !== undefined && newBytes.length > props.maxlength) {
    fieldValue.value = oldValue;
    return;
  }

  modelBytes.value = newBytes;
});
</script>

<template>
  <div class="BytesInput">
    <textarea v-focus="autofocus === true" v-model="fieldValue" spellcheck="false"></textarea>
  </div>
</template>
