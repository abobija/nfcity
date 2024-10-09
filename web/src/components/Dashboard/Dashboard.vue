<script setup lang="ts">
import Client from '@/comm/Client';
import { onClientMessage, onClientReady } from '@/comm/hooks/ClientEmitHooks';
import HelloDevMessage from '@/comm/msgs/dev/HelloDevMessage';
import PiccDevMessage from '@/comm/msgs/dev/PiccDevMessage';
import PiccStateChangedDevMessage from '@/comm/msgs/dev/PiccStateChangedDevMessage';
import GetPiccWebMessage from '@/comm/msgs/web/GetPiccWebMessage';
import '@/components/Dashboard/Dashboard.scss';
import BlockRenderer from '@/components/Dashboard/renderers/BlockRenderer.vue';
import ByteRenderer from '@/components/Dashboard/renderers/ByteRenderer.vue';
import GroupRenderer from '@/components/Dashboard/renderers/GroupRenderer.vue';
import SectorRenderer from '@/components/Dashboard/renderers/SectorRenderer.vue';
import TargetByte from '@/components/Dashboard/TargetByte';
import Memory from '@/components/Memory/Memory.vue';
import MemoryFocus from '@/components/Memory/MemoryFocus';
import {
  onMemoryByteMouseClick,
  onMemoryByteMouseEnter,
  onMemoryByteMouseLeave
} from '@/components/MemoryByte/hooks/MemoryByteEmitHooks';
import SystemInfo from '@/components/SystemInfo/SystemInfo.vue';
import MifareClassic, {
  MifareClassicBlock,
  MifareClassicBlockGroup,
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { PiccState, PiccType } from '@/models/Picc';
import { CancelationToken, OperationCanceledError } from '@/utils/CancelationToken';
import { hex } from '@/utils/helpers';
import { Logger } from '@/utils/Logger';
import { inject, onMounted, onUnmounted, ref, watch } from 'vue';

enum DashboardState {
  Undefined = 0,
  Initialized,
  CheckingForReader,
  CeckingForPicc,
  PiccNotPresent,
  PiccRemoved,
  PiccPaired,
}

const logger = Logger.fromName('Dashboard');
const client = inject('client') as Client;
const state = ref<DashboardState>(DashboardState.Undefined);
const picc = ref<MifareClassic | undefined>(undefined);
const memoryFocus = ref<MemoryFocus | undefined>(undefined);
const tByte = ref<TargetByte | undefined>(undefined);
const retryMax = ref(5);
const retryCount = ref(0);
const checkingForReaderCancelationToken = ref<CancelationToken>();
const pingCancelationToken = ref<CancelationToken>();

watch(state, async (newState, oldState) => {
  logger.debug(
    'state changed',
    'from', DashboardState[oldState],
    'to', DashboardState[newState]
  );

  switch (newState) {
    case DashboardState.Initialized: {
      checkingForReaderCancelationToken.value?.cancel("State changed to Initialized");
      pingCancelationToken.value?.cancel("State changed to Initialized");
      state.value = DashboardState.CheckingForReader;
    } break;
    case DashboardState.CheckingForReader: {
      retryMax.value = retryCount.value = 5;
      checkingForReaderCancelationToken.value?.cancel("State changed to CheckingForReader");
      checkingForReaderCancelationToken.value = CancelationToken.create();
      do {
        try {
          await client.ping(checkingForReaderCancelationToken.value as CancelationToken);
          break;
        }
        catch (e) {
          if (e instanceof OperationCanceledError) {
            break;
          }
          logger.debug('Failed to ping while checking for reader', e);
        }
      } while (--retryCount.value > 0);

      if (checkingForReaderCancelationToken.value.isCanceled) {
        logger.debug("Checking for reader canceled, reason:", checkingForReaderCancelationToken.value.reason);
      }

      if (retryCount.value === 0) {
        logger.error('Failed to ping device after', retryMax.value, 'retries');
        client.disconnect();
        return;
      }

      if (state.value <= DashboardState.CheckingForReader) {
        state.value = DashboardState.CeckingForPicc;
      }
    } break;
    case DashboardState.CeckingForPicc: {
      client.send(GetPiccWebMessage.create());
    } break;
  }
});

watch(picc, (newPicc, oldPicc) => {
  if (newPicc && oldPicc && newPicc.hasUidOf(oldPicc)) {
    return;
  }

  memoryFocus.value = undefined;
  tByte.value = undefined;
});

onMounted(() => state.value = DashboardState.Initialized);

onClientReady(() => state.value = DashboardState.Initialized);

onUnmounted(() => {
  checkingForReaderCancelationToken.value?.cancel("Dashboard unmounted");
  pingCancelationToken.value?.cancel("Dashboard unmounted");
});

onClientMessage(e => {
  if (state.value == DashboardState.CheckingForReader) {
    checkingForReaderCancelationToken.value?.cancel("New message arrived from device");
  }

  // start pinging on first message from device
  if (!pingCancelationToken.value || pingCancelationToken.value.isCanceled) {
    pingCancelationToken.value = CancelationToken.create();
    client.pingLoop(2500, pingCancelationToken.value);
  }

  if (!HelloDevMessage.is(e.message)) {
    return;
  }

  if (state.value >= DashboardState.PiccPaired) {
    client.send(GetPiccWebMessage.create());
  }
  else if (state.value > DashboardState.CeckingForPicc) {
    state.value = DashboardState.CeckingForPicc;
  } else {
    state.value = DashboardState.CheckingForReader;
  }
});

onClientMessage(e => {
  const { message } = e;

  if (!PiccDevMessage.is(message) && !PiccStateChangedDevMessage.is(message)) {
    return;
  }

  const piccDto = message.picc;

  if (piccDto.type === PiccType.Undefined) {
    // ignore, device did not scanned a single picc yet
    return;
  }

  if (!MifareClassic.isMifareClassic(piccDto)) {
    logger.error('Unsupported PICC type', PiccType[piccDto.type]);
    client.disconnect();
    return;
  }

  if (picc.value === undefined || !picc.value.hasUidOf(piccDto)) {
    picc.value = MifareClassic.fromDto(piccDto);
  } else { // Same card
    picc.value.state = piccDto.state;
  }

  if ([PiccState.Active, PiccState.ActiveH].includes(picc.value.state)) {
    state.value = DashboardState.PiccPaired;
    return;
  }

  if (picc.value.state == PiccState.Idle) {
    if (PiccStateChangedDevMessage.is(message)
      && [PiccState.Active, PiccState.ActiveH].includes(message.old_state)) {
      state.value = DashboardState.PiccRemoved;
      return;
    }

    state.value = DashboardState.PiccNotPresent;
    return;
  }
});

onMemoryByteMouseEnter(e => {
  logger.verbose('Block byte entered', e);

  if (tByte.value?.locked) {
    return;
  }

  tByte.value = {
    index: e.index,
    group: e.group,
    locked: false,
  };
});

onMemoryByteMouseLeave(e => {
  logger.verbose('Block byte left', e);

  if (tByte.value?.locked) {
    return;
  }

  tByte.value = undefined;
});

onMemoryByteMouseClick(clickedByte => {
  logger.verbose('Block byte clicked', clickedByte);

  if (!tByte.value) {
    return;
  }

  let targetedByte = tByte.value;

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
  targetedByte = tByte.value = {
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
  <div class="dashboard component">
    <div class="scene picc-waiter center-screen" v-if="state < DashboardState.PiccPaired">

      <div v-if="state == DashboardState.CheckingForReader">
        <p class="message">checking for a reader...</p>
        <p class="sub message" v-if="retryCount > 0 && retryCount < retryMax">
          no response from device, retrying {{ retryCount }}
        </p>
      </div>
      <div v-else-if="state == DashboardState.CeckingForPicc">
        <p class="message">checking for a card...</p>
      </div>
      <div v-else-if="state == DashboardState.PiccNotPresent">
        <p class="message">put a card on the reader</p>
      </div>
      <div v-else-if="state == DashboardState.PiccRemoved">
        <p class="message">card removed, put it back please</p>
      </div>

    </div>
    <div class="scene main" v-else-if="picc">

      <div class="header">
        <div class="picc">
          <div class="general">
            <h1 class="type">{{ PiccType[picc.type] }}</h1>
            <ul class="metas">
              <li class="meta">
                <span class="name">UID</span>
                <span class="value">{{ hex(picc.uid) }}</span>
              </li>
              <li class="meta">
                <span class="name">ATQA</span>
                <span class="value">{{ hex(picc.atqa) }}</span>
              </li>
              <li class="meta">
                <span class="name">SAK</span>
                <span class="value">{{ hex(picc.sak) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="misc">
          <SystemInfo />
        </div>
      </div>

      <div class="main">
        <div class="section">
          <Memory :memory="picc.memory as MifareClassicMemory" :focus="memoryFocus as MemoryFocus | undefined" />
        </div>
        <div class="section">
          <div class="info-panel">
            <Transition appear>
              <div v-if="picc.memory.isEmpty">
                <p v-for="(d) in picc.memory.blockDistribution">
                  {{ d[0] }} sectors with {{ d[1] }} blocks
                </p>
                <p>{{ MifareClassicBlock.size }} bytes per block</p>
                <p>{{ picc.memory.size }} bytes of memory</p>
              </div>
            </Transition>

            <div v-if="tByte">
              <SectorRenderer :sector="tByte.group.block.sector as MifareClassicSector" />
              <BlockRenderer :block="tByte.group.block as MifareClassicBlock" />
              <GroupRenderer :group="tByte.group as MifareClassicBlockGroup" />
              <ByteRenderer :byte="tByte as TargetByte" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
