<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import useClient from "@/composables/useClient";
import { MifareClassicBlockGroup } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { overwriteArraySegment } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import BytesInput from "@Memory/components/BytesInput/BytesInput.vue";
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{
  group: MifareClassicBlockGroup;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'done'): void;
}>();

const logger = makeLogger('MemoryEditor');
const { client } = useClient();
const block = computed(() => props.group.block);
const key = computed(() => block.value.sector.key);
const bytesToEdit = computed(() => props.group.data());
const editingBytes = ref(bytesToEdit.value);
const maxlength = computed(() => bytesToEdit.value.length);
const saveable = ref(false);
const saving = ref(false);

onMounted(() => {
  if (!key.value) {
    logger.warning('sector has not been authenticated, cannot write');
    emit('cancel');
  }
});

watch(editingBytes, (bytes) => {
  saveable.value = editingBytes.value.length === bytesToEdit.value.length
    && bytes.some((b, i) => b !== bytesToEdit.value[i]) === true;
});

async function onSubmit() {
  if (!saveable.value) {
    logger.debug('edited bytes are not saveable, skipping');
    return;
  }

  if (!key.value) {
    throw new Error('key missing');
  }

  const dataToWrite = overwriteArraySegment(
    Array.from(block.value.data),
    editingBytes.value,
    props.group.offset
  );

  const newBlock: UpdatablePiccBlock = {
    address: block.value.address,
    data: dataToWrite,
  };

  const request = new WriteBlockWebMessage(
    newBlock.address,
    Uint8Array.from(newBlock.data),
    {
      type: key.value.type,
      value: Uint8Array.from(key.value.value),
    }
  );

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

    block.value.updateWith(updatableBlock);
    saving.value = false;
    emit('done');
  } catch (e) {
    logger.error('write failed', e);
    saving.value = false;
  }
}
</script>

<template>
  <div class="MemoryEditor">
    <form class="edit" @submit.prevent="onSubmit">
      <div class="form-group">
        <BytesInput v-model="editingBytes" :maxlength autofocus multiline resizable />
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary" :disabled="!saveable || saving">save</button>
        <button type="button" class="btn secondary" @click="$emit('cancel')">cancel</button>
      </div>
    </form>
  </div>
</template>
