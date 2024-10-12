<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccSectorDeviceMessage } from "@/communication/messages/device/PiccSectorDeviceMessage";
import ReadSectorWebMessage from "@/communication/messages/web/ReadSectorWebMessage";
import MemoryBlock from "@/components/MemoryBlock/MemoryBlock.vue";
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorFocus from "@/components/MemorySector/MemorySectorFocus";
import MemorySectorState from "@/components/MemorySector/MemorySectorState";
import MemorySectorEmptyOverlay from "@/components/MemorySector/overlays/MemorySectorEmptyOverlay.vue";
import MemorySectorUnlockOverlay from "@/components/MemorySector/overlays/MemorySectorUnlockOverlay.vue";
import MemorySectorUnlockingOverlay from "@/components/MemorySector/overlays/MemorySectorUnlockingOverlay.vue";
import useClient from "@/composables/useClient";
import {
  MifareClassicSector
} from "@/models/MifareClassic";
import { PiccKey } from "@/models/Picc";
import { computed, onUpdated, ref } from "vue";

const props = defineProps<{
  sector: MifareClassicSector;
  state: MemorySectorState;
  focus?: MemorySectorFocus;
}>();

const emit = defineEmits<{
  (e: 'stateChange', state: MemorySectorState): void;
}>();

const classes = computed(() => ({
  focused: props.focus?.sector === props.sector,
  empty: props.sector.isEmpty,
}));

const { client } = useClient();
const piccKey = ref<PiccKey>(props.sector.key);
const sectorOffset = computed(() => props.sector.memory.offsetOfSector(props.sector));

async function unlockAndLoadSector(key: PiccKey) {
  piccKey.value = key;

  try {
    emit('stateChange', MemorySectorState.Unlocking);
    const msg = await client.value.transceive(ReadSectorWebMessage.from(sectorOffset.value, key));

    if (isPiccSectorDeviceMessage(msg)) {
      props.sector.updateWith({ key, blocks: msg.blocks });
      emit('stateChange', MemorySectorState.UnlockedAndLoaded);
      return;
    }

    if (isErrorDeviceMessage(msg)) {
      emit('stateChange', MemorySectorState.Unlock);
      return;
    }
  } catch (e) {
    emit('stateChange', MemorySectorState.Unlock);
  }
}

onUpdated(() => {
  if (props.state == MemorySectorState.Empty) {
    piccKey.value = props.sector.key;
  }
});
</script>

<template>
  <div class="memory-sector component" :class="classes">
    <div class="meta">
      <span class="offset">{{ sectorOffset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock :block v-for="block in sector.blocks" :key="block.address" :focus="focus?.blockFocus" />

      <Transition>
        <MemorySectorEmptyOverlay v-if="state == MemorySectorState.Empty"
          @click="$emit('stateChange', MemorySectorState.Unlock)" />
        <MemorySectorUnlockOverlay :piccKey :sector v-else-if="state == MemorySectorState.Unlock"
          @unlock="unlockAndLoadSector" />
        <MemorySectorUnlockingOverlay v-else-if="state == MemorySectorState.Unlocking" />
      </Transition>
    </div>
  </div>
</template>
