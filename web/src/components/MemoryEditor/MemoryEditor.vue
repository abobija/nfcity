<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import useClient from "@/composables/useClient";
import { MifareClassicBlockGroup, MifareClassicBlockType } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { arraysAreEqual, assert, hex, overwriteArraySegment } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import BytesInput from "@Memory/components/BytesInput/BytesInput.vue";
import { computed, onMounted, ref, watch } from "vue";

enum MemoryEditorState {
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
  group: MifareClassicBlockGroup;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'done'): void;
}>();

const logger = makeLogger('MemoryEditor');
const { client } = useClient();
const state = ref(MemoryEditorState.Undefined);
const block = computed(() => props.group.block);
const key = computed(() => block.value.sector.key);
const bytesToEdit = computed(() => props.group.data());
const editingBytes = ref(bytesToEdit.value);
const maxlength = computed(() => bytesToEdit.value.length);
const saveable = ref(false);
const confirmBlock = ref<UpdatablePiccBlock>();

watch(state, async (newState, oldState) => {
  logger.debug('state changed from', MemoryEditorState[oldState], 'to', MemoryEditorState[newState]);

  switch (newState) {
    case MemoryEditorState.Initialized: {
      state.value = MemoryEditorState.Editing;
    } break;
    case MemoryEditorState.Canceled: {
      emit('cancel');
    } break;
    case MemoryEditorState.Confirmed: {
      state.value = MemoryEditorState.Saving;
    } break;
    case MemoryEditorState.Saving: {
      await save();
    } break;
    case MemoryEditorState.SaveSucceeded: {
      state.value = MemoryEditorState.Done;
    } break;
    case MemoryEditorState.Done: {
      emit('done');
    } break;
  }
})

onMounted(() => {
  if (!key.value) {
    logger.warning('sector has not been authenticated, cannot write');
    state.value = MemoryEditorState.Canceled;
    return;
  }

  state.value = MemoryEditorState.Initialized;
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
      state.value = MemoryEditorState.SaveFailed;
      return;
    }

    assert(isPiccBlockDeviceMessage(response), 'unexpected response, expecting picc block');

    const updatedBlock: UpdatablePiccBlock = {
      address: response.address,
      data: Array.from(response.data),
    };

    assert(updatedBlock.address === confirmBlock.value.address, 'address mismatch');
    assert(props.group.block.type !== MifareClassicBlockType.Data
      || arraysAreEqual(updatedBlock.data, confirmBlock.value.data), 'data mismatch');

    block.value.updateWith(updatedBlock);
    state.value = MemoryEditorState.SaveSucceeded;
  } catch (e) {
    logger.error('write failed', e);
    state.value = MemoryEditorState.SaveFailed;
  }
}

function confirm() {
  if (!saveable.value) {
    logger.debug('edited bytes are not saveable, skipping');
    return;
  }

  const dataToWrite = overwriteArraySegment(
    Array.from(block.value.data),
    editingBytes.value,
    props.group.offset
  );

  confirmBlock.value = {
    address: block.value.address,
    data: dataToWrite,
  };

  state.value = MemoryEditorState.Confirming;
}
</script>

<template>
  <section class="MemoryEditor">
    <form v-if="state == MemoryEditorState.Editing" class="edit" @submit.prevent="confirm">
      <div class="form-group">
        <BytesInput v-model="editingBytes" :maxlength autofocus multiline resizable />
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary" :disabled="!saveable">save</button>
        <button type="button" class="btn secondary" @click="state = MemoryEditorState.Canceled">cancel</button>
      </div>
    </form>
    <div v-else-if="state == MemoryEditorState.Confirming && confirmBlock" class="confirm">
      <p>
        Click "yes" if you are sure you want to update block
        at address <var>{{ hex(confirmBlock.address) }}</var> with the next data:
      </p>
      <div class="confirm-data">
        <BytesInput v-model="confirmBlock.data" readonly multiline resizable />
      </div>
      <div class="form-group">
        <button type="button" class="btn primary" @click="state = MemoryEditorState.Confirmed">yes</button>
        <button type="button" class="btn secondary" @click="state = MemoryEditorState.Editing">no</button>
      </div>
    </div>
    <div v-else-if="state == MemoryEditorState.Saving" class="saving">
      <p>Saving...</p>
    </div>
  </section>
</template>

<style lang="scss">
@import '@/theme.scss';

.MemoryEditor {
  .confirm-data {
    margin: 1rem 0;
    color: $color-5;
  }
}
</style>
