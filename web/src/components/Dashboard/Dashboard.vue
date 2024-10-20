<script setup lang="ts">
import onClientMessage from "@/communication/composables/onClientMessage";
import onClientOffline from "@/communication/composables/onClientOffline";
import onClientPongMissed from "@/communication/composables/onClientPongMissed";
import onClientReady from "@/communication/composables/onClientReady";
import { DeviceMessage } from "@/communication/Message";
import HelloDeviceMessage, { isHelloDeviceMessage } from "@/communication/messages/device/HelloDeviceMessage";
import PiccDeviceMessage, { isPiccDeviceMessage } from "@/communication/messages/device/PiccDeviceMessage";
import PiccStateChangedDeviceMessage, { isPiccStateChangedDeviceMessage } from "@/communication/messages/device/PiccStateChangedDeviceMessage";
import GetPiccWebMessage from "@/communication/messages/web/GetPiccWebMessage";
import BlockGroupStatusBarItem from "@/components/Dashboard/BlockGroupStatusBarItem.vue";
import BlockInfoRenderer from "@/components/Dashboard/BlockInfoRenderer.vue";
import ByteStatusBarItem from "@/components/Dashboard/ByteStatusBarItem.vue";
import SectorStatusBarItem from "@/components/Dashboard/SectorStatusBarItem.vue";
import StatusBar from "@/components/Dashboard/StatusBar.vue";
import TargetByte from "@/components/Dashboard/TargetByte";
import SystemInfo from "@/components/SystemInfo/SystemInfo.vue";
import useClient from "@/composables/useClient";
import MifareClassic, {
  blockSize,
} from "@/models/MifareClassic/MifareClassic";
import MifareClassicBlock from "@/models/MifareClassic/MifareClassicBlock";
import MifareClassicBlockGroup from "@/models/MifareClassic/MifareClassicBlockGroup";
import MifareClassicMemory from "@/models/MifareClassic/MifareClassicMemory";
import MifareClassicSector from "@/models/MifareClassic/MifareClassicSector";
import { PiccState, PiccType } from "@/models/Picc";
import { CancelationToken, OperationCanceledError } from "@/utils/CancelationToken";
import { hex } from "@/utils/helpers";
import makeLogger from "@/utils/Logger";
import onByteMouseClick from "@Memory/components/Byte/composables/onByteMouseClick";
import onByteMouseEnter from "@Memory/components/Byte/composables/onByteMouseEnter";
import onByteMouseLeave from "@Memory/components/Byte/composables/onByteMouseLeave";
import Memory from "@Memory/Memory.vue";
import MemoryFocus from "@Memory/MemoryFocus";
import { onMounted, onUnmounted, ref, watch } from "vue";

enum DashboardState {
  Exit = -1,
  Undefined = 0,
  Initialized,
  ClientOffline, // TODO: implement timeout for reconnection
  CheckingForReader,
  CeckingForPicc,
  PiccNotPresent,
  PiccRemoved,
  PongMissed,
  PiccPaired,
}

const emit = defineEmits<{
  (e: 'exit'): void;
}>();

const logger = makeLogger('Dashboard');
const { client } = useClient();
const state = ref<DashboardState>(DashboardState.Undefined);
const picc = ref<MifareClassic | undefined>(undefined);
const memoryFocus = ref<MemoryFocus | undefined>(undefined);
const targetByte = ref<TargetByte | undefined>(undefined);
const retryMax = ref(5);
const retryCount = ref(0);
const checkingForReaderCancelationToken = ref<CancelationToken>();
const pingCancelationToken = ref<CancelationToken>();
const overlay = ref(true);

function onEveryDeviceMessage(_message: DeviceMessage) {
  switch (state.value) {
    case DashboardState.CheckingForReader: {
      checkingForReaderCancelationToken.value?.cancel("new dev msg arrived");
    } break;
    case DashboardState.PongMissed: {
      state.value = DashboardState.PiccPaired;
      pingCancelationToken.value?.cancel("new dev msg arrived");
    } break;
  }

  // start pinging on first message from device
  if (!pingCancelationToken.value || pingCancelationToken.value.isCanceled) {
    pingCancelationToken.value = new CancelationToken();
    client.value.pingLoop(2500, pingCancelationToken.value);
  }
}

function onHelloDeviceMessage(_message: HelloDeviceMessage) {
  if (state.value >= DashboardState.PiccPaired) {
    client.value.send(new GetPiccWebMessage());
  }
  else if (state.value > DashboardState.CeckingForPicc) {
    state.value = DashboardState.CeckingForPicc;
  } else {
    state.value = DashboardState.CheckingForReader;
  }
}

function onPiccOrPiccStateChangeDeviceMessage(message: PiccDeviceMessage | PiccStateChangedDeviceMessage) {
  const _picc = message.picc;

  if (_picc.type === PiccType.Undefined) {
    // ignore, device did not scanned a single picc yet
    return;
  }

  if (!MifareClassic.isMifareClassic(_picc)) {
    logger.error('unsupported PICC type', PiccType[_picc.type]);
    state.value = DashboardState.Exit;
    return;
  }

  if (picc.value === undefined || (picc.value.hash !== MifareClassic.calculateHash(_picc))) {
    picc.value = MifareClassic.fromDto(_picc);
  } else { // Same card
    picc.value.state = _picc.state;
  }

  if ([PiccState.Active, PiccState.ActiveH].includes(picc.value.state)) {
    state.value = DashboardState.PiccPaired;
    return;
  }

  if (picc.value.state == PiccState.Idle) {
    if (isPiccStateChangedDeviceMessage(message)
      && [PiccState.Active, PiccState.ActiveH].includes(message.old_state)) {
      state.value = DashboardState.PiccRemoved;
      return;
    }

    state.value = DashboardState.PiccNotPresent;
    return;
  }
}

watch(state, async (newState, oldState) => {
  logger.debug(
    'state changed',
    'from', DashboardState[oldState],
    'to', DashboardState[newState]
  );

  overlay.value = newState < DashboardState.PiccPaired;

  switch (newState) {
    case DashboardState.Exit: {
      emit('exit');
    } break;
    case DashboardState.Initialized: {
      checkingForReaderCancelationToken.value?.cancel("state changed to Initialized");
      pingCancelationToken.value?.cancel("state changed to Initialized");
      state.value = DashboardState.CheckingForReader;
    } break;
    case DashboardState.CheckingForReader: {
      retryMax.value = retryCount.value = 5;
      checkingForReaderCancelationToken.value?.cancel("state changed to CheckingForReader");
      checkingForReaderCancelationToken.value = new CancelationToken();
      do {
        try {
          await client.value.ping(checkingForReaderCancelationToken.value as CancelationToken);
          break;
        }
        catch (e) {
          if (e instanceof OperationCanceledError) {
            break;
          }
          logger.debug('failed to ping while checking for reader', e);
        }
      } while (--retryCount.value > 0);

      if (checkingForReaderCancelationToken.value.isCanceled) {
        logger.debug("checking for reader canceled, reason:", checkingForReaderCancelationToken.value.reason);
      }

      if (retryCount.value === 0) {
        logger.error('failed to ping device after', retryMax.value, 'retries');
        state.value = DashboardState.Exit;
        return;
      }

      if (state.value <= DashboardState.CheckingForReader) {
        state.value = DashboardState.CeckingForPicc;
      }
    } break;
    case DashboardState.CeckingForPicc: {
      client.value.send(new GetPiccWebMessage());
    } break;
  }
});

watch(picc, (newPicc, oldPicc) => {
  logger.debug('picc changed', 'from', oldPicc, 'to', newPicc);

  memoryFocus.value = undefined;
  targetByte.value = undefined;
}, { deep: false });

onMounted(() => state.value = DashboardState.Initialized);

onClientReady(() => state.value = DashboardState.Initialized);

onClientOffline(() => state.value = DashboardState.ClientOffline);

onUnmounted(() => {
  checkingForReaderCancelationToken.value?.cancel("dashboard unmounted");
  pingCancelationToken.value?.cancel("dashboard unmounted");
});

onClientPongMissed(() => {
  if (state.value > DashboardState.PongMissed) {
    state.value = DashboardState.PongMissed;
  }
});

onClientMessage(e => {
  onEveryDeviceMessage(e.message);

  if (isHelloDeviceMessage(e.message)) {
    onHelloDeviceMessage(e.message)
  } else if (isPiccDeviceMessage(e.message) || isPiccStateChangedDeviceMessage(e.message)) {
    onPiccOrPiccStateChangeDeviceMessage(e.message);
  }
});

onByteMouseEnter(e => {
  if (!e.group.block.loaded) {
    return;
  }

  if (targetByte.value?.locked) {
    return;
  }

  targetByte.value = {
    index: e.index,
    group: e.group,
    locked: false,
  };
});

onByteMouseLeave((e) => {
  if (!e.group.block.loaded) {
    return;
  }

  if (targetByte.value?.locked) {
    return;
  }

  targetByte.value = undefined;
});

onByteMouseClick(clickedByte => {
  if (!clickedByte.group.block.loaded) {
    return;
  }

  if (!targetByte.value) {
    return;
  }

  let targetedByte = targetByte.value;

  if (
    targetedByte.locked
    && targetedByte.index === clickedByte.index
    && targetedByte.group.block.hasSameAddressAs(clickedByte.group.block)) {
    // unlock previous byte
    targetedByte.locked = false;
    memoryFocus.value = undefined;
    return;
  }

  // lock new byte
  targetedByte = targetByte.value = {
    index: clickedByte.index,
    group: clickedByte.group,
    locked: true,
  };

  memoryFocus.value = MemoryFocus.byte(
    targetedByte.group as MifareClassicBlockGroup,
    targetedByte.index
  );
});
</script>

<template>
  <section class="Dashboard">

    <StatusBar>
      <template #left>
        <div class="state">
          <abbr title="Dashboard status">{{ DashboardState[state] }}</abbr>
        </div>
        <SectorStatusBarItem v-if="targetByte" :sector="targetByte.group.block.sector as MifareClassicSector" />
        <BlockGroupStatusBarItem v-if="targetByte" :group="targetByte.group as MifareClassicBlockGroup" />
        <ByteStatusBarItem v-if="targetByte" :byte="targetByte as TargetByte" />
      </template>
      <template #right>
        <SystemInfo />
      </template>
    </StatusBar>

    <header>
      <div v-if="picc" class="picc" :key="picc.hash">
        <div class="general">
          <h1 class="type">{{ PiccType[picc.type] }}</h1>
          <ul class="metas">
            <li class="meta">
              <span class="name">UID</span>
              <var class="value">{{ hex(picc.uid, ' ') }}</var>
            </li>
            <li class="meta">
              <span class="name">ATQA</span>
              <var class="value">{{ hex(picc.atqa) }}</var>
            </li>
            <li class="meta">
              <span class="name">SAK</span>
              <var class="value">{{ hex(picc.sak) }}</var>
            </li>
          </ul>
        </div>
      </div>
    </header>

    <main v-if="picc" :key="picc.hash">
      <section class="memory">
        <Memory :memory="picc.memory as MifareClassicMemory" :focus="memoryFocus as MemoryFocus | undefined" />
      </section>
      <section class="info">
        <div class="info-panel">
          <Transition appear>
            <div v-if="picc.memory.isEmpty">
              <p>
                {{ PiccType[picc.type] }} card has
              </p>
              <p v-for="(d) in picc.memory.blockDistribution">
                {{ d[0] }} sectors with {{ d[1] }} blocks,
              </p>
              <p>{{ blockSize }} bytes per block,</p>
              <p>{{ picc.memory.size }} bytes of memory.</p>
            </div>
          </Transition>

          <BlockInfoRenderer v-if="targetByte" :block="targetByte.group.block as MifareClassicBlock" />
        </div>
      </section>
    </main>

    <div class="full-screen center overlay" v-if="overlay">
      <div class="content">
        <Transition mode="out-in" :duration="100" appear>
          <div v-if="state == DashboardState.ClientOffline">
            <p class="message">server connection lost</p>
            <p class="sub message">hang tight, attempting to reconnect...</p>
          </div>
          <div v-else-if="state == DashboardState.CheckingForReader">
            <p class="message">checking for a reader...</p>
            <p class="sub message" v-if="retryCount > 0 && retryCount < retryMax">
              no response from device, retrying {{ retryCount }}
            </p>
          </div>
          <div v-else-if="state == DashboardState.CeckingForPicc">
            <p class="message">checking for a card...</p>
          </div>
          <div v-else-if="state == DashboardState.PiccNotPresent">
            <p class="message">bring a card closer to the reader</p>
          </div>
          <div v-else-if="state == DashboardState.PiccRemoved">
            <p class="message">card removed, please bring it back</p>
          </div>
          <div v-else-if="state == DashboardState.PongMissed">
            <p class="message">device is not responding</p>
            <p class="sub message">please wait a moment, the device should recover soon</p>
          </div>
        </Transition>
      </div>
    </div>

  </section>
</template>

<style lang="scss">
@use 'sass:color';
@use '@/theme' as *;

.Dashboard {
  margin: 2rem 1rem 1rem 1rem;
}

.Dashboard>header {
  display: flex;
  justify-content: space-between;

  .meta {
    .name {
      color: rgba($color-fg, 0.5);
    }
  }

  .picc {
    .general {
      .type {
        font-size: 1.5rem;
        color: $color-3;
        font-weight: 600;
      }

      .metas {
        display: flex;
        margin-top: .5rem;

        .meta {
          &:not(:last-child) {
            margin-right: 1rem;
          }

          .name {
            margin-right: 1rem;
          }
        }
      }
    }
  }
}

.Dashboard>main {
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;

  &>section.info {
    flex-grow: 1;
  }

  >section {
    &:not(:last-child) {
      margin-right: 1rem;
    }

    .info-panel {
      position: sticky;
      top: 2rem;
      color: $color-4;

      p.hint {
        color: $color-1;
        font-size: .9rem;
      }

      >p:not(:last-child) {
        margin-bottom: 1.5rem;
      }
    }
  }
}

.Dashboard>.overlay {
  background-color: rgba($color-bg, .6);

  .content {
    padding: 1rem;
    background-color: $color-bg;
    box-shadow: 0 0 3rem 3rem $color-bg;
    text-shadow: 0 0 .2rem $color-bg,
      0 0 1.5rem rgba($color-3, .75);
  }

  .message {
    font-size: 1.3rem;
    color: $color-3;
    text-align: center;

    &:not(:first-child) {
      margin-top: 0.5rem;
    }

    &.sub {
      font-size: 0.8rem;
      color: color.adjust($color-4, $blackness: +50%);
    }

    &:not(.sub) {
      animation: glichy-overlay-message 3s ease-in-out infinite;

      @keyframes glichy-overlay-message {

        49%,
        51%,
        53% {
          transform: skewX(0);
        }

        50%,
        52% {
          transform: skewX(15deg);
        }
      }
    }
  }
}
</style>
