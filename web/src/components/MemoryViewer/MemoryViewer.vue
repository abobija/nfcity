<script setup lang="ts">
import MemoryEditor from "@/components/MemoryEditor/MemoryEditor.vue";
import MemoryView from "@/components/MemoryViewer/MemoryView";
import '@/components/MemoryViewer/MemoryViewer.scss';
import { MifareClassicBlock } from "@/models/MifareClassic";
import { ascii, bin, hex, isAsciiPrintable } from "@/utils/helpers";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  offset?: number;
  length?: number;
  view?: MemoryView;
  edit?: boolean;
}>();

defineEmits<{
  (e: 'viewChangeProposal', viewProposal: MemoryView): void;
}>();

const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? (props.block.data.length - _offset.value));
const bytes = computed(() => props.block.data.slice(_offset.value, _offset.value + _length.value));
const _view = computed(() => props.view || MemoryView.Hexadecimal);
const editingBytes = ref<Uint8Array>();

watch(
  () => { props.block.address, props.offset, props.length },
  () => editingBytes.value = undefined,
  { deep: true }
);

function onEdit() {
  editingBytes.value = Uint8Array.from(bytes.value); // clone
}

function onEditCanceled() {
  editingBytes.value = undefined;
}

function oneEditDone() {
  editingBytes.value = undefined;
}
</script>

<template>
  <div class="memory-bytes-viewer component">
    <div v-if="!editingBytes" class="toolbar">
      <div class="view group">
        <div class="btn-group">
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Hexadecimal }"
            @click="$emit('viewChangeProposal', MemoryView.Hexadecimal)">hex</button>
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Binary }"
            @click="$emit('viewChangeProposal', MemoryView.Binary)">bin</button>
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Decimal }"
            @click="$emit('viewChangeProposal', MemoryView.Decimal)">dec</button>
          <button class="btn secondary" :class="{ activated: _view === MemoryView.Ascii }"
            @click="$emit('viewChangeProposal', MemoryView.Ascii)">ascii</button>
        </div>
      </div>
      <div class="modify group">
        <div class="btn-group">
          <button class="btn secondary" :disabled="!edit" @click="onEdit">edit</button>
        </div>
      </div>
    </div>
    <MemoryEditor v-if="editingBytes" v-model="editingBytes" :block :offset="_offset" :length="_length"
      @cancel="onEditCanceled" @done="oneEditDone" />
    <div v-else-if="_view == MemoryView.Decimal" class="bytes">
      {{ bytes.join(' ') }}
    </div>
    <div v-else-if="_view == MemoryView.Binary" class="bytes">
      {{ bin(bytes) }}
    </div>
    <div v-else-if="_view == MemoryView.Ascii" class="bytes">
      <span v-for="b in bytes" class="ascii" :class="{ 'non-printable': !isAsciiPrintable(b) }"
        :title="!isAsciiPrintable(b) ? `0x${hex(b)}` : ''">
        {{ ascii(b) }}
      </span>
    </div>
    <div v-else class="bytes">
      {{ hex(bytes) }}
    </div>
  </div>
</template>
