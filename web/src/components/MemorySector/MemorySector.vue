<script setup lang="ts">
import Client from '@/comm/Client';
import ErrorDevMessage from '@/comm/msgs/dev/ErrorDevMessage';
import PiccSectorDevMessage from '@/comm/msgs/dev/PiccSectorDevMessage';
import ReadSectorWebMessage from '@/comm/msgs/web/ReadSectorWebMessage';
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorFocus from '@/components/MemorySector/MemorySectorFocus';
import {
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { PiccKey } from '@/models/Picc';
import { computed, inject } from 'vue';
import MemorySectorEmptyOverlay from './MemorySectorEmptyOverlay.vue';
import MemorySectorState from './MemorySectorState';
import MemorySectorUnlockOverlay from './MemorySectorUnlockOverlay.vue';
import MemorySectorUnlockingOverlay from './MemorySectorUnlockingOverlay.vue';

const props = defineProps<{
  sector: MifareClassicSector;
  state: MemorySectorState;
  focus?: MemorySectorFocus;
}>();

const emit = defineEmits<{
  (e: 'stateChange', state: MemorySectorState): void;
}>();

const classes = computed(() => ({
  focused: props.focus?.sector.hasSameOffsetAs(props.sector),
  empty: props.sector.isEmpty,
}));

const client = inject('client') as Client;

async function unlockAndLoadSector(key: PiccKey) {
  emit('stateChange', MemorySectorState.Unlocking);
  const msg = await client.send(ReadSectorWebMessage.from(props.sector.offset, key));

  if (PiccSectorDevMessage.is(msg)) {
    props.sector.memory.updateSector(msg.offset, msg.blocks);
    emit('stateChange', MemorySectorState.UnlockedAndLoaded);
    return;
  }

  if (ErrorDevMessage.is(msg)) {
    emit('stateChange', MemorySectorState.Unlock);
    return;
  }
}
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
        <MemorySectorEmptyOverlay v-if="state == MemorySectorState.Empty"
          @click="$emit('stateChange', MemorySectorState.Unlock)" />
        <MemorySectorUnlockOverlay :sector="sector" v-else-if="state == MemorySectorState.Unlock"
          @unlock="unlockAndLoadSector" />
        <MemorySectorUnlockingOverlay v-else-if="state == MemorySectorState.Unlocking" />
      </Transition>
    </div>
  </div>
</template>
