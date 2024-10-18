<script setup lang="ts">
import { isErrorDeviceMessage } from "@/communication/messages/device/ErrorDeviceMessage";
import { isPiccSectorDeviceMessage } from "@/communication/messages/device/PiccSectorDeviceMessage";
import ReadSectorWebMessage from "@/communication/messages/web/ReadSectorWebMessage";
import useClient from "@/composables/useClient";
import { defaultKey } from "@/models/MifareClassic/MifareClassicAuthorization";
import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { keyTypeName, PiccKey } from "@/models/Picc";
import makeLogger from "@/utils/Logger";
import Block from "@Memory/components/Block/Block.vue";
import onSectorAuthFormShown from "@Memory/components/Sector/composables/onSectorAuthFormShown";
import SectorAuthFormShownEvent from "@Memory/components/Sector/events/SectorAuthFormShownEvent";
import AuthenticationFormSectorOverlay from "@Memory/components/Sector/overlays/AuthenticationFormSectorOverlay.vue";
import AuthenticationInProgressSectorOverlay from "@Memory/components/Sector/overlays/AuthenticationInProgressSectorOverlay.vue";
import LockedSectorOverlay from "@Memory/components/Sector/overlays/LockedSectorOverlay.vue";
import sectorEmits from "@Memory/components/Sector/sectorEmits";
import SectorFocus from "@Memory/components/Sector/SectorFocus";
import { computed, ref, watch } from "vue";

const enum SectorState {
  Locked,
  AuthenticationForm,
  AuthenticationInProgress,
  Authenticated,
}

const props = defineProps<{
  sector: MifareClassicSector;
  focus?: SectorFocus;
}>();

const { client } = useClient();
const logger = makeLogger('Sector');
const state = ref<SectorState>(SectorState.Locked);
const key = ref(props.sector.key || defaultKey);
const classes = computed(() => ({
  focused: props.focus?.sector === props.sector,
  empty: props.sector.isEmpty,
}));

watch(state, newState => {
  if (newState === SectorState.AuthenticationForm) {
    sectorEmits.emit(
      'sectorAuthFormShown',
      new SectorAuthFormShownEvent(props.sector)
    );
  }
});

onSectorAuthFormShown(e => {
  if (e.sector !== props.sector && state.value === SectorState.AuthenticationForm) {
    state.value = SectorState.Locked;
  }
});

watch(key, newKey => authenticateAndLoadSector(newKey));

async function authenticateAndLoadSector(key: PiccKey) {
  try {
    state.value = SectorState.AuthenticationInProgress;
    const msg = await client.value.transceive(new ReadSectorWebMessage(props.sector.offset, {
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
      state.value = SectorState.Authenticated;
      return;
    }

    if (isErrorDeviceMessage(msg)) {
      state.value = SectorState.AuthenticationForm;
      return;
    }
  } catch (e) {
    logger.warning('failed to authenticate sector', e);
    state.value = SectorState.AuthenticationForm;
  }
}
</script>

<template>
  <section class="Sector" :class="classes">
    <div class="meta">
      <span class="offset" title="Sector offset">
        {{ sector.offset }}
      </span>
      <span v-if="sector.key" title="Authentication key type">
        {{ keyTypeName(sector.key.type) }}
      </span>
    </div>
    <div class="blocks">
      <Block :block v-for="block in sector.blocks" :key="block.address" :focus="focus?.blockFocus" />

      <Transition>
        <LockedSectorOverlay class="SectorOverlay" v-if="state == SectorState.Locked"
          @click="() => state = SectorState.AuthenticationForm" />
        <AuthenticationFormSectorOverlay class="SectorOverlay" v-model="key" :sector
          v-else-if="state == SectorState.AuthenticationForm" @cancel="() => state = SectorState.Locked" />
        <AuthenticationInProgressSectorOverlay class="SectorOverlay"
          v-else-if="state == SectorState.AuthenticationInProgress" />
      </Transition>
    </div>
  </section>
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
    margin-right: .3rem;
    text-align: right;
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
