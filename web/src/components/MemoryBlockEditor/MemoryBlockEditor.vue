<script lang="ts">
export function isBlockEditable(block: MifareClassicBlock): boolean {
  const { key } = block.sector;

  if (key === undefined) {
    return false;
  }

  return (
    (block instanceof MifareClassicDataBlock && block.keyCan(key, 'write'))
    || (block instanceof MifareClassicSectorTrailerBlock && block.keyCanWriteToAnyGroup(key))
    // TODO: add support for value blocks
  );
}
</script>

<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import BytesInput from "@/components/BytesInput/BytesInput.vue";
import SectorTrailerBlockEditForm from "@/components/MemoryBlockEditor/SectorTrailerBlockEditForm.vue";
import useClient from "@/composables/useClient";
import MifareClassicDataBlock from "@/models/MifareClassic/blocks/MifareClassicDataBlock";
import MifareClassicSectorTrailerBlock from "@/models/MifareClassic/blocks/MifareClassicSectorTrailerBlock";
import {
  blockSize,
} from "@/models/MifareClassic/MifareClassic";
import MifareClassicBlock, { MifareClassicBlockType } from "@/models/MifareClassic/MifareClassicBlock";
import { UpdatablePiccBlock } from "@/models/Picc";
import { arraysAreEqual, assert, hex } from "@/utils/helpers";
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
  logger.debug('editing-bytes', hex(bytes));

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

  const dataToWrite = editingBytes.value;
  assert(dataToWrite.length === blockSize, 'unexpected data length');

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
          <BytesInput class="data" v-model="editingBytes" autofocus multiline resizable placeholder="Data" />
        </div>
      </div>
      <div v-if="block instanceof MifareClassicSectorTrailerBlock">
        <SectorTrailerBlockEditForm v-model="editingBytes" :block />
      </div>
      <div class="form-group">
        <button type="button" class="btn secondary" @click="state = MemoryBlockEditorState.Canceled">cancel</button>
        <button type="submit" class="btn secondary" :disabled="!saveable">
          next &raquo;
        </button>
      </div>
    </form>
    <div v-else-if="state == MemoryBlockEditorState.Confirming && confirmBlock" class="confirm">
      <p>
        Click "save" if you are sure you want to update block
        at address <var>{{ hex(confirmBlock.address) }}</var> with the next data:
      </p>
      <div class="confirm-data">
        <BytesInput class="data" v-model="confirmBlock.data" readonly multiline resizable />
      </div>
      <div class="form-group">
        <button type="button" class="btn secondary" @click="state = MemoryBlockEditorState.Editing">
          &laquo; back
        </button>
        <button type="button" class="btn secondary" @click="state = MemoryBlockEditorState.Canceled">cancel</button>
        <button type="button" class="btn primary" @click="state = MemoryBlockEditorState.Confirmed">save</button>
      </div>
    </div>
    <div v-else-if="state == MemoryBlockEditorState.Saving" class="saving">
      <p>Saving...</p>
    </div>
  </section>
</template>

<style lang="scss">
@use '@/theme' as *;

.MemoryBlockEditor {

  button,
  textarea,
  input[type="text"] {
    font-size: .9rem !important;
    padding: .3rem .5rem !important;
  }

  .BytesInput.data {
    width: 75%;
    margin: .8rem 0 1.3rem 0;
  }

  .confirm-data {
    margin: 1rem 0;
    color: $color-5;
  }
}
</style>
