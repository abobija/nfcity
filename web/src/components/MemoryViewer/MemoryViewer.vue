<script setup lang="ts">
import MemoryView from '@/components/MemoryViewer/MemoryView';
import '@/components/MemoryViewer/MemoryViewer.scss';
import { MifareClassicBlock } from '@/models/MifareClassic';
import { ascii, bin, hex, isAsciiPrintable } from '@/utils/helpers';
import { computed } from 'vue';

const props = defineProps<{
  block: MifareClassicBlock;
  offset?: number;
  length?: number;
  view?: MemoryView;
}>();

defineEmits<{
  (e: 'viewChange', view: MemoryView): void;
}>();

const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? (props.block.data.length - _offset.value));
const bytes = computed(() => props.block.data.slice(_offset.value, _offset.value + _length.value));
const _view = computed(() => props.view || MemoryView.Hexadecimal);
</script>

<template>
  <div class="memory-bytes-viewer component">
    <div class="view">
      <div class="btn-group">
        <button :class="{ activated: _view === MemoryView.Hexadecimal }"
          @click="$emit('viewChange', MemoryView.Hexadecimal)">hex</button>
        <button :class="{ activated: _view === MemoryView.Binary }"
          @click="$emit('viewChange', MemoryView.Binary)">bin</button>
        <button :class="{ activated: _view === MemoryView.Decimal }"
          @click="$emit('viewChange', MemoryView.Decimal)">dec</button>
        <button :class="{ activated: _view === MemoryView.Ascii }"
          @click="$emit('viewChange', MemoryView.Ascii)">ascii</button>
      </div>
    </div>
    <div class="bytes" v-if="_view == MemoryView.Decimal">
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
