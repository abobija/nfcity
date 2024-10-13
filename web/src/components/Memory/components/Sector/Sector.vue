<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccSectorDeviceMessage } from "@/communication/messages/device/PiccSectorDeviceMessage";
import ReadSectorWebMessage from "@/communication/messages/web/ReadSectorWebMessage";
import '@/components/Memory/components/Sector/Sector.scss';
import SectorFocus from "@/components/Memory/components/Sector/SectorFocus";
import SectorState from "@/components/Memory/components/Sector/SectorState";
import useClient from "@/composables/useClient";
import {
  MifareClassicSector
} from "@/models/MifareClassic";
import { PiccKey } from "@/models/Picc";
import { computed, onUpdated, ref } from "vue";
import Block from "../Block/Block.vue";
import SectorEmptyOverlay from "./overlays/SectorEmptyOverlay.vue";
import SectorUnlockOverlay from "./overlays/SectorUnlockOverlay.vue";
import SectorUnlockingOverlay from "./overlays/SectorUnlockingOverlay.vue";

const props = defineProps<{
  sector: MifareClassicSector;
  state: SectorState;
  focus?: SectorFocus;
}>();

const emit = defineEmits<{
  (e: 'stateChange', state: SectorState): void;
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
    emit('stateChange', SectorState.Unlocking);
    const msg = await client.value.transceive(ReadSectorWebMessage.from(sectorOffset.value, {
      type: key.type,
      value: Uint8Array.from(key.value),
    }));

    if (isPiccSectorDeviceMessage(msg)) {
      props.sector.updateWith({
        key,
        blocks: msg.blocks.map(b => ({
          address: b.address,
          data: Array.from(b.data),
        })),
      });
      emit('stateChange', SectorState.UnlockedAndLoaded);
      return;
    }

    if (isErrorDeviceMessage(msg)) {
      emit('stateChange', SectorState.Unlock);
      return;
    }
  } catch (e) {
    emit('stateChange', SectorState.Unlock);
  }
}

onUpdated(() => {
  if (props.state == SectorState.Empty) {
    piccKey.value = props.sector.key;
  }
});
</script>

<template>
  <div class="Sector" :class="classes">
    <div class="meta">
      <span class="offset">{{ sectorOffset }}</span>
    </div>
    <div class="blocks">
      <Block :block v-for="block in sector.blocks" :key="block.address" :focus="focus?.blockFocus" />

      <Transition>
        <SectorEmptyOverlay v-if="state == SectorState.Empty" @click="$emit('stateChange', SectorState.Unlock)" />
        <SectorUnlockOverlay :piccKey :sector v-else-if="state == SectorState.Unlock" @unlock="unlockAndLoadSector"
          @cancel="$emit('stateChange', SectorState.Empty)" />
        <SectorUnlockingOverlay v-else-if="state == SectorState.Unlocking" />
      </Transition>
    </div>
  </div>
</template>
