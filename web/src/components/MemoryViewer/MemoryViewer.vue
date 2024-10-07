<script setup lang="ts">
import '@/components/MemoryViewer/MemoryViewer.scss';
import { ascii, bin, hex, isAsciiPrintable } from '@/helpers';
import { MifareClassicBlock } from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryBytesView from './MemoryView';

const props = defineProps<{
  block: MifareClassicBlock;
  offset?: number;
  length?: number;
  view?: MemoryBytesView;
}>();

defineEmits<{
  (e: 'viewChange', view: MemoryBytesView): void;
}>();

const _offset = computed(() => props.offset ?? 0);
const _length = computed(() => props.length ?? (props.block.data.length - _offset.value));
const bytes = computed(() => props.block.data.slice(_offset.value, _offset.value + _length.value));
const _view = computed(() => props.view || MemoryBytesView.Hexadecimal);
</script>

<template>
  <div class="memory-bytes-viewer component">
    <div class="view">
      <div class="btn-group">
        <button :class="{ activated: _view === MemoryBytesView.Hexadecimal }"
          @click="$emit('viewChange', MemoryBytesView.Hexadecimal)">hex</button>
        <button :class="{ activated: _view === MemoryBytesView.Binary }"
          @click="$emit('viewChange', MemoryBytesView.Binary)">bin</button>
        <button :class="{ activated: _view === MemoryBytesView.Decimal }"
          @click="$emit('viewChange', MemoryBytesView.Decimal)">dec</button>
        <button :class="{ activated: _view === MemoryBytesView.Ascii }"
          @click="$emit('viewChange', MemoryBytesView.Ascii)">ascii</button>
      </div>
    </div>
    <div class="bytes" v-if="_view == MemoryBytesView.Decimal">
      {{ bytes.join(' ') }}
    </div>
    <div class="bytes" v-else-if="_view == MemoryBytesView.Binary">
      {{ bin(bytes) }}
    </div>
    <div class="bytes" v-else-if="_view == MemoryBytesView.Ascii">
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
