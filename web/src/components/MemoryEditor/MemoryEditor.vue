<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import useClient from "@/composables/useClient";
import { MifareClassicBlock } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { hex, isHex, removeWhitespace, unhexToArray } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  offset: number;
  length: number;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'done'): void;
}>();

const logger = makeLogger('MemoryEditor');
const bytesToEdit = computed(() => props.block.data.slice(props.offset, props.offset + props.length));
const editingBytes = ref(bytesToEdit.value);
const maxlength = computed(() => bytesToEdit.value.length * 2);
const value = ref<string>(hex(editingBytes.value));
const field = useTemplateRef('field');
const saveable = ref(false);
const { client } = useClient();
const saving = ref(false);

onMounted(() => field.value?.focus());

watch(value, v => editingBytes.value = unhexToArray(removeWhitespace(v)));

watch(editingBytes, (bytes) => {
  saveable.value = editingBytes.value.length === bytesToEdit.value.length
    && bytes.some((b, i) => b !== bytesToEdit.value[i]) === true;
});

function validateKey(e: KeyboardEvent) {
  if (e.key.length !== 1 || !isHex(e.key)) {
    e.preventDefault();
  }
}

async function onSubmit() {
  if (!saveable.value) {
    logger.debug('edited bytes are not saveable, skipping');
    return;
  }

  // clone block bytes
  const writeBlockData = Array.from(props.block.data);

  // modify clone with edited bytes
  editingBytes.value.forEach(
    (b, i) => writeBlockData[props.offset + i] = b
  );

  const newBlock: UpdatablePiccBlock = {
    address: props.block.address,
    data: writeBlockData,
  };

  const request = WriteBlockWebMessage.from({
    address: props.block.address,
    data: Uint8Array.from(writeBlockData),
  }, {
    type: props.block.sector.key.type,
    value: Uint8Array.from(props.block.sector.key.value),
  });

  try {
    saving.value = true;
    const response = await client.value.transceive(request);

    if (isErrorDeviceMessage(response)) {
      logger.warning('write failed, error code', response.code);
      saving.value = false;
      return;
    }

    if (!isPiccBlockDeviceMessage(response)) {
      logger.warning('unexpected response, expecting picc block, got', response);
      saving.value = false;
      return;
    }

    const updatableBlock: UpdatablePiccBlock = {
      address: response.address,
      data: Array.from(response.data),
    };

    if (updatableBlock.address != newBlock.address) {
      logger.warning('unexpected response, address mismatch, sent', newBlock.address, 'received', updatableBlock.address);
      saving.value = false;
      return;
    }

    props.block.updateWith(updatableBlock);
    saving.value = false;
    emit('done');
  } catch (e) {
    logger.error('write failed', e);
    saving.value = false;
  }
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
        <button type="submit" class="btn primary" :disabled="!saveable || saving">save</button>
        <button type="button" class="btn secondary" @click="$emit('cancel')">cancel</button>
      </div>
    </form>

  </div>
</template>
