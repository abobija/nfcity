<script setup lang="ts">
import '@/components/MemoryBytesViewer/MemoryBytesViewer.scss';
import { ascii, bin, hex, isAsciiPrintable } from '@/helpers';
import { computed } from 'vue';
import MemoryBytesView from './MemoryBytesView';

const props = defineProps<{
  bytes: Uint8Array;
  view?: MemoryBytesView;
}>();

defineEmits<{
  (e: 'viewChange', view: MemoryBytesView): void;
}>();

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
