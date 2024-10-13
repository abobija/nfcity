<script setup lang="ts">
import MemoryEditor from "@/components/MemoryEditor/MemoryEditor.vue";
import { MifareClassicBlock } from "@/models/MifareClassic";
import { ascii, bin, hex, isAsciiPrintable } from "@/utils/helpers";
import ByteRepresentation from "@Memory/ByteRepresentation";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  offset?: number;
  length?: number;
  view?: ByteRepresentation;
  edit?: boolean;
}>();

defineEmits<{
  (e: 'viewChangeProposal', viewProposal: ByteRepresentation): void;
}>();

const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? (props.block.data.length - _offset.value));
const bytes = computed(() => props.block.data.slice(_offset.value, _offset.value + _length.value));
const _view = computed(() => props.view || ByteRepresentation.Hexadecimal);
const editMode = ref(false);

watch(
  () => [props.block.address, props.offset, props.length],
  () => editMode.value = false
);
</script>

<template>
  <div class="MemoryViewer">
    <div v-if="!editMode" class="toolbar">
      <div class="view group">
        <div class="btn-group">
          <button class="btn secondary" :class="{ activated: _view === ByteRepresentation.Hexadecimal }"
            @click="$emit('viewChangeProposal', ByteRepresentation.Hexadecimal)">hex</button>
          <button class="btn secondary" :class="{ activated: _view === ByteRepresentation.Binary }"
            @click="$emit('viewChangeProposal', ByteRepresentation.Binary)">bin</button>
          <button class="btn secondary" :class="{ activated: _view === ByteRepresentation.Decimal }"
            @click="$emit('viewChangeProposal', ByteRepresentation.Decimal)">dec</button>
          <button class="btn secondary" :class="{ activated: _view === ByteRepresentation.Ascii }"
            @click="$emit('viewChangeProposal', ByteRepresentation.Ascii)">ascii</button>
        </div>
      </div>
      <div class="modify group">
        <div class="btn-group">
          <button class="btn secondary" :disabled="!edit" @click="editMode = true">edit</button>
        </div>
      </div>
    </div>
    <MemoryEditor v-if="editMode" :block :offset="_offset" :length="_length" @cancel="editMode = false"
      @done="editMode = false" />
    <div v-else-if="_view == ByteRepresentation.Decimal" class="bytes">
      {{ bytes.join(' ') }}
    </div>
    <div v-else-if="_view == ByteRepresentation.Binary" class="bytes">
      {{ bin(bytes, ' ') }}
    </div>
    <div v-else-if="_view == ByteRepresentation.Ascii" class="bytes">
      <span v-for="b in bytes" class="ascii" :class="{ 'non-printable': !isAsciiPrintable(b) }"
        :title="!isAsciiPrintable(b) ? `0x${hex(b)}` : ''">
        {{ ascii(b) }}
      </span>
    </div>
    <div v-else class="bytes">
      {{ hex(bytes, ' ') }}
    </div>
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.MemoryViewer {
  .toolbar {
    display: flex;
    justify-content: start;

    &>.group:not(:first-child) {
      margin-left: 1rem;
    }
  }

  .bytes {
    margin-top: .4rem;

    .ascii.non-printable {
      opacity: .3;
    }
  }
}
</style>
