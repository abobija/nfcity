<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import useClient from "@/composables/useClient";
import { MifareClassicBlock, MifareClassicBlockType } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { arraysAreEqual, assert, hex, overwriteArraySegment } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import BytesInput from "@Memory/components/BytesInput/BytesInput.vue";
import { computed, onMounted, ref, watch } from "vue";

enum DataBlockEditorState {
  Undefined = 0,
  Initialized,
  Editing,
  Canceled,
  Confirming,
  Confirmed,
  Saving,
  SaveFailed,
  SaveSucceeded,
  Done,
}

const props = defineProps<{
  block: MifareClassicBlock;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'done'): void;
}>();

const logger = makeLogger('DataBlockEditor');
const { client } = useClient();
const state = ref(DataBlockEditorState.Undefined);
const key = computed(() => props.block.sector.key);
const bytesToEdit = computed(() => props.block.data);
const editingBytes = ref(Array.from(bytesToEdit.value));
const maxlength = computed(() => bytesToEdit.value.length);
const saveable = ref(false);
const confirmBlock = ref<UpdatablePiccBlock>();

watch(state, async (newState, oldState) => {
  logger.debug('state changed from', DataBlockEditorState[oldState], 'to', DataBlockEditorState[newState]);

  switch (newState) {
    case DataBlockEditorState.Initialized: {
      state.value = DataBlockEditorState.Editing;
    } break;
    case DataBlockEditorState.Canceled: {
      emit('cancel');
    } break;
    case DataBlockEditorState.Confirmed: {
      state.value = DataBlockEditorState.Saving;
    } break;
    case DataBlockEditorState.Saving: {
      await save();
    } break;
    case DataBlockEditorState.SaveSucceeded: {
      state.value = DataBlockEditorState.Done;
    } break;
    case DataBlockEditorState.Done: {
      emit('done');
    } break;
  }
})

onMounted(() => {
  if (!key.value) {
    logger.warning('sector has not been authenticated, cannot write');
    state.value = DataBlockEditorState.Canceled;
    return;
  }

  state.value = DataBlockEditorState.Initialized;
});

watch(editingBytes, (bytes) => {
  saveable.value = editingBytes.value.length === bytesToEdit.value.length
    && bytes.some((b, i) => b !== bytesToEdit.value[i]) === true;
});

async function save() {
  assert(key.value !== undefined);
  assert(confirmBlock.value !== undefined);

  const request = new WriteBlockWebMessage(
    confirmBlock.value.address,
    Uint8Array.from(confirmBlock.value.data),
    {
      type: key.value.type,
      value: Uint8Array.from(key.value.value),
    }
  );

  try {
    const response = await client.value.transceive(request);

    if (isErrorDeviceMessage(response)) {
      logger.warning('write failed, error code', response.code);
      state.value = DataBlockEditorState.SaveFailed;
      return;
    }

    assert(isPiccBlockDeviceMessage(response), 'unexpected response, expecting picc block');

    const updatedBlock: UpdatablePiccBlock = {
      address: response.address,
      data: Array.from(response.data),
    };

    assert(updatedBlock.address === confirmBlock.value.address, 'address mismatch');
    assert(props.block.type !== MifareClassicBlockType.Data
      || arraysAreEqual(updatedBlock.data, confirmBlock.value.data), 'data mismatch');

    props.block.updateWith(updatedBlock);
    state.value = DataBlockEditorState.SaveSucceeded;
  } catch (e) {
    logger.error('write failed', e);
    state.value = DataBlockEditorState.SaveFailed;
  }
}

function confirm() {
  if (!saveable.value) {
    logger.debug('edited bytes are not saveable, skipping');
    return;
  }

  const dataToWrite = overwriteArraySegment(
    Array.from(props.block.data),
    editingBytes.value
  );

  confirmBlock.value = {
    address: props.block.address,
    data: dataToWrite,
  };

  state.value = DataBlockEditorState.Confirming;
}
</script>

<template>
  <section class="DataBlockEditor">
    <form v-if="state == DataBlockEditorState.Editing" class="edit" @submit.prevent="confirm">
      <div class="form-group">
        <BytesInput v-model="editingBytes" :maxlength autofocus multiline resizable />
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary" :disabled="!saveable">save</button>
        <button type="button" class="btn secondary" @click="state = DataBlockEditorState.Canceled">cancel</button>
      </div>
    </form>
    <div v-else-if="state == DataBlockEditorState.Confirming && confirmBlock" class="confirm">
      <p>
        Click "yes" if you are sure you want to update block
        at address <var>{{ hex(confirmBlock.address) }}</var> with the next data:
      </p>
      <div class="confirm-data">
        <BytesInput v-model="confirmBlock.data" readonly multiline resizable />
      </div>
      <div class="form-group">
        <button type="button" class="btn primary" @click="state = DataBlockEditorState.Confirmed">yes</button>
        <button type="button" class="btn secondary" @click="state = DataBlockEditorState.Editing">no</button>
      </div>
    </div>
    <div v-else-if="state == DataBlockEditorState.Saving" class="saving">
      <p>Saving...</p>
    </div>
  </section>
</template>

<style lang="scss">
@import '@/theme.scss';

.DataBlockEditor {
  .confirm-data {
    margin: 1rem 0;
    color: $color-5;
  }
}
</style>
