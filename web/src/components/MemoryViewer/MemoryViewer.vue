<script setup lang="ts">
import WriteBlockWebMessage from "@/communication/messages/web/WriteBlockWebMessage";
import MemoryEditor from "@/components/MemoryEditor/MemoryEditor.vue";
import MemoryView from "@/components/MemoryViewer/MemoryView";
import '@/components/MemoryViewer/MemoryViewer.scss';
import { MifareClassicBlock } from "@/models/MifareClassic";
import { UpdatablePiccBlock } from "@/models/Picc";
import { ascii, bin, hex, isAsciiPrintable } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  offset?: number;
  length?: number;
  view?: MemoryView;
  edit?: boolean;
}>();

defineEmits<{
  (e: 'viewChange', view: MemoryView): void;
}>();

const logger = makeLogger('MemoryViewer');
const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? (props.block.data.length - _offset.value));
const bytes = computed(() => props.block.data.slice(_offset.value, _offset.value + _length.value));
const _view = computed(() => props.view || MemoryView.Hexadecimal);
const editingBytes = ref<Uint8Array>();
const editingBytesAreSaveable = ref(false);

watch(editingBytes, () => {
  editingBytesAreSaveable.value = editingBytes.value?.length === bytes.value.length &&
    editingBytes.value?.some((b, i) => b !== bytes.value[i]) === true;
});

watch(
  () => { props.block.address, props.offset, props.length },
  () => editingBytes.value = undefined,
  { deep: true }
);

function onEdit() {
  editingBytes.value = Uint8Array.from(bytes.value); // clone
}

function onEditCancel() {
  editingBytes.value = undefined;
}

function onEditSubmit() {
  if (!editingBytesAreSaveable.value || !editingBytes.value) {
    logger.debug('edited bytes are not saveable, skipping');
    return;
  }

  // clone original bytes
  const bytesToWrite = Uint8Array.from(props.block.data);

  // modify clone with edited bytes
  editingBytes.value.forEach(
    (b, i) => bytesToWrite[_offset.value + i] = b
  );

  const newBlock: UpdatablePiccBlock = {
    address: props.block.address,
    data: bytesToWrite,
  };

  const message = WriteBlockWebMessage.from(newBlock, props.block.sector.key);

  logger.info('TODO: send message to update block', message);

  editingBytes.value = undefined;
}
</script>

<template>
  <div class="memory-bytes-viewer component">
    <div v-if="!editingBytes" class="toolbar">
      <div class="view group">
        <div class="btn-group">
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Hexadecimal }"
            @click="$emit('viewChange', MemoryView.Hexadecimal)">hex</button>
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Binary }"
            @click="$emit('viewChange', MemoryView.Binary)">bin</button>
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Decimal }"
            @click="$emit('viewChange', MemoryView.Decimal)">dec</button>
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Ascii }"
            @click="$emit('viewChange', MemoryView.Ascii)">ascii</button>
        </div>
      </div>

      <div class="modify group">
        <div class="btn-group">
          <button class="btn secondary" :disabled="!edit" @click="onEdit">edit</button>
        </div>
      </div>
    </div>
    <form class="edit" v-if="editingBytes" @submit.prevent="onEditSubmit">
      <div class="form-group">
        <MemoryEditor v-model="editingBytes" />
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary" :disabled="!editingBytesAreSaveable">save</button>
        <button type="button" class="btn secondary" @click="onEditCancel">cancel</button>
      </div>
    </form>
    <div class="bytes" v-else-if="_view == MemoryView.Decimal">
      {{ bytes.join(' ') }}
    </div>
    <div class="bytes" v-else-if="_view == MemoryView.Binary">
      {{ bin(bytes) }}
    </div>
    <div class="bytes" v-else-if="_view == MemoryView.Ascii">
      <span v-for="b in bytes" class="ascii" :class="{ 'non-printable': !isAsciiPrintable(b) }"
        :title="!isAsciiPrintable(b) ? `0x${hex(b)}` : ''">
        {{ ascii(b) }}
      </span>
    </div>
    <div class="bytes" v-else>
      {{ hex(bytes) }}
    </div>
  </div>
</template>
