<script setup lang="ts">
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import { MifareClassicBlock } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { hex, hex2arr, isHex, removeWhitespace } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";

const logger = makeLogger('MemoryEditor');
const bytes = defineModel<Uint8Array>({ required: true });
const bytesOrigin = ref(Uint8Array.from(bytes.value));
const maxlength = computed(() => bytesOrigin.value.length * 2);
const value = ref<string>(hex(bytes.value, ''));
const field = useTemplateRef('field');
const saveable = ref(false);

const props = defineProps<{
  block: MifareClassicBlock;
  offset: number;
  length: number;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'close'): void;
}>();

onMounted(() => field.value?.focus());

watch(value, v => bytes.value = hex2arr(removeWhitespace(v)));

watch(bytes, () => saveable.value = bytes.value.some((b, i) => b !== bytesOrigin.value[i]) === true);

function validateKey(e: KeyboardEvent) {
  if (e.key.length !== 1 || !isHex(e.key)) {
    e.preventDefault();
  }
}

function onSubmit() {
  if (!saveable.value) {
    logger.debug('edited bytes are not saveable, skipping');
    return;
  }

  // clone original bytes
  const bytesToWrite = Uint8Array.from(props.block.data);

  // modify clone with edited bytes
  bytes.value.forEach(
    (b, i) => bytesToWrite[props.offset + i] = b
  );

  const newBlock: UpdatablePiccBlock = {
    address: props.block.address,
    data: bytesToWrite,
  };

  const message = WriteBlockWebMessage.from(newBlock, props.block.sector.key);

  logger.info('TODO: send message to update block', message);

  emit('close');
}
</script>

<template>
  <div class="memory-editor component">

    <form class="edit" @submit.prevent="onSubmit">
      <div class="form-group">
        <textarea class="field" ref="field" v-model="value" @keypress="validateKey" :maxlength
          spellcheck="false"></textarea>
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary" :disabled="!saveable">save</button>
        <button type="button" class="btn secondary" @click="$emit('cancel')">cancel</button>
      </div>
    </form>

  </div>
</template>
