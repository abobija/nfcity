<script lang="ts">
export function isBlockEditable(block: MifareClassicBlock): boolean {
  const { key } = block.sector;

  if (key === undefined) {
    return false;
  }

  return (
    (block instanceof MifareClassicDataBlock && block.keyCan(key, 'write'))
    || (block instanceof MifareClassicSectorTrailerBlock && block.keyCanWriteToAnyGroup(key))
  );
}
</script>

<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import BytesInput from "@/components/BytesInput/BytesInput.vue";
import useClient from "@/composables/useClient";
import { MifareClassicBlock, MifareClassicBlockType, MifareClassicDataBlock, MifareClassicSectorTrailerBlock } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { arraysAreEqual, assert, hex, overwriteArraySegment } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import { computed, onMounted, ref, watch } from "vue";

enum MemoryBlockEditorState {
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

const logger = makeLogger('MemoryBlockEditor');
const { client } = useClient();
const state = ref(MemoryBlockEditorState.Undefined);
const key = computed(() => props.block.sector.key);
const bytesToEdit = computed(() => props.block.data);
const editingBytes = ref(Array.from(bytesToEdit.value));
const maxlength = computed(() => bytesToEdit.value.length);
const saveable = ref(false);
const confirmBlock = ref<UpdatablePiccBlock>();

watch(state, async (newState, oldState) => {
  logger.debug('state changed from', MemoryBlockEditorState[oldState], 'to', MemoryBlockEditorState[newState]);

  switch (newState) {
    case MemoryBlockEditorState.Initialized: {
      state.value = MemoryBlockEditorState.Editing;
    } break;
    case MemoryBlockEditorState.Canceled: {
      emit('cancel');
    } break;
    case MemoryBlockEditorState.Confirmed: {
      state.value = MemoryBlockEditorState.Saving;
    } break;
    case MemoryBlockEditorState.Saving: {
      await save();
    } break;
    case MemoryBlockEditorState.SaveSucceeded: {
      state.value = MemoryBlockEditorState.Done;
    } break;
    case MemoryBlockEditorState.Done: {
      emit('done');
    } break;
  }
})

onMounted(() => {
  if (!key.value) {
    logger.warning('sector has not been authenticated, cannot write');
    state.value = MemoryBlockEditorState.Canceled;
    return;
  }

  state.value = MemoryBlockEditorState.Initialized;
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
      state.value = MemoryBlockEditorState.SaveFailed;
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
    state.value = MemoryBlockEditorState.SaveSucceeded;
  } catch (e) {
    logger.error('write failed', e);
    state.value = MemoryBlockEditorState.SaveFailed;
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

  state.value = MemoryBlockEditorState.Confirming;
}
</script>

<template>
  <section class="MemoryBlockEditor">
    <form v-if="state == MemoryBlockEditorState.Editing" class="edit" @submit.prevent="confirm">
      <div v-if="block instanceof MifareClassicDataBlock">
        <div class="form-group">
          <BytesInput v-model="editingBytes" :maxlength autofocus multiline resizable />
        </div>
      </div>
      <div v-if="block instanceof MifareClassicSectorTrailerBlock">
        <!-- TODO: -->
        <p>Edit of sector trailer blocks is not supported yet.</p>
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary" :disabled="!saveable">save</button>
        <button type="button" class="btn secondary" @click="state = MemoryBlockEditorState.Canceled">cancel</button>
      </div>
    </form>
    <div v-else-if="state == MemoryBlockEditorState.Confirming && confirmBlock" class="confirm">
      <p>
        Click "yes" if you are sure you want to update block
        at address <var>{{ hex(confirmBlock.address) }}</var> with the next data:
      </p>
      <div class="confirm-data">
        <BytesInput v-model="confirmBlock.data" readonly multiline resizable />
      </div>
      <div class="form-group">
        <button type="button" class="btn primary" @click="state = MemoryBlockEditorState.Confirmed">yes</button>
        <button type="button" class="btn secondary" @click="state = MemoryBlockEditorState.Editing">no</button>
      </div>
    </div>
    <div v-else-if="state == MemoryBlockEditorState.Saving" class="saving">
      <p>Saving...</p>
    </div>
  </section>
</template>

<style lang="scss">
@import '@/theme.scss';

.MemoryBlockEditor {
  .confirm-data {
    margin: 1rem 0;
    color: $color-5;
  }
}
</style>
