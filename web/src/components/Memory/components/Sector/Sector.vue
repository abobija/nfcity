<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccSectorDeviceMessage } from "@/communication/messages/device/PiccSectorDeviceMessage";
import ReadSectorWebMessage from "@/communication/messages/web/ReadSectorWebMessage";
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

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

$transition: .3s ease-in-out;

.Sector {
  display: flex;
  flex-direction: row;
  justify-content: right;

  >.meta {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    font-weight: 600;
    color: $color-4;
    transition: color $transition;

    .offset {
      padding-right: 0.3rem;
    }
  }

  >.blocks {
    position: relative;
    display: flex;
    flex-direction: column-reverse;
    border-style: solid;
    border-color: rgba($color-fg, .2);
    border-width: 2px 1px 1px 1px;
    transition: border $transition, box-shadow $transition;
  }

  &:hover,
  &.focused {
    >.meta {
      color: $color-fg;
    }

    >.blocks {
      border-color: rgba($color-fg, .6) !important;
      box-shadow: 0 0 1rem rgba($color-fg, .1);
    }
  }
}

.Sector:not(.empty) {
  .Byte {
    border-style: solid;
  }

  &:hover {
    .Byte {
      border-color: color.adjust($color-bg, $lightness: +12%);
    }
  }
}

.SectorOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 0.8rem;

  &.v-enter-active {
    animation: sector-overlay-in .2s;
  }

  &.v-leave-active {
    animation: sector-overlay-in .1s reverse;
  }

  @keyframes sector-overlay-in {
    0% {
      opacity: 0;
      transform: scale(.8);
    }

    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

}
</style>
