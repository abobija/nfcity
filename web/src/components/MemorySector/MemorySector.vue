<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorFocus from '@/components/MemorySector/MemorySectorFocus';
import {
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { computed, onMounted, ref } from 'vue';
import MemorySectorEmptyOverlay from './MemorySectorEmptyOverlay.vue';
import MemorySectorUnlockOverlay from './MemorySectorUnlockOverlay.vue';

enum SectorState {
  Undefined = 0,
  Empty,
  Unlocking,
}

const props = defineProps<{
  sector: MifareClassicSector;
  focus?: MemorySectorFocus;
}>();

const state = ref<SectorState>(SectorState.Undefined);

function onEmptyOverlayClick() {
  state.value = SectorState.Unlocking;
}

const classes = computed(() => ({
  focused: props.focus?.sector.hasSameOffsetAs(props.sector),
  empty: props.sector.isEmpty,
}));

onMounted(() => {
  if (props.sector.isEmpty) {
    state.value = SectorState.Empty;
  }
});
</script>

<template>
  <div class="memory-sector component" :class="classes">
    <div class="meta">
      <span class="offset">{{ sector.offset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock :block="sector.blockAt(blockOffset)"
        v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocksInSector(sector.offset) })"
        :key="blockOffset" :focus="focus?.blockFocus" />

      <Transition>
        <MemorySectorEmptyOverlay v-if="state == SectorState.Empty" @click="onEmptyOverlayClick" />
        <MemorySectorUnlockOverlay :sector="sector" v-else-if="state == SectorState.Unlocking" />
      </Transition>
    </div>
  </div>
</template>
