<script setup lang="ts">
import MemoryView from '@/components/MemoryViewer/MemoryView';
import '@/components/MemoryViewer/MemoryViewer.scss';
import { MifareClassicBlock } from '@/models/MifareClassic';
import { ascii, bin, hex, isAsciiPrintable } from '@/utils/helpers';
import makeLogger from '@/utils/Logger';
import { computed, ref } from 'vue';
import MemoryEdit from '../MemoryEdit/MemoryEdit.vue';

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

function onEdit() {
  editingBytes.value = Uint8Array.from(bytes.value); // clone
}

function onEditCancel() {
  editingBytes.value = undefined;
}

function onEditSubmit() {
  if (!editingBytes.value) {
    logger.warning('edit submitted with no editing bytes');
    return;
  }
  else if (editingBytes.value.length !== bytes.value.length) {
    logger.warning('edit submitted with invalid length', editingBytes.value.length, 'expected', bytes.value.length);
    return;
  }
  else if (editingBytes.value.some((b, i) => b !== bytes.value[i]) !== true) {
    logger.debug('edit submitted with no changes, skipping');
  }
  else {
    logger.info('TODO: edit submitted with new bytes', editingBytes.value);
  }

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
        <MemoryEdit v-model="editingBytes" />
      </div>
      <div class="form-group">
        <button type="submit" class="btn primary">save</button>
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
