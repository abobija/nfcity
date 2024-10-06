<script setup lang="ts">
import Client from '@/comm/Client';
import { onClientMessage } from '@/comm/hooks/ClientEventHooks';
import HelloDevMessage from '@/comm/msgs/dev/HelloDevMessage';
import PiccDevMessage from '@/comm/msgs/dev/PiccDevMessage';
import PiccSectorDevMessage from '@/comm/msgs/dev/PiccSectorDevMessage';
import PiccStateChangedDevMessage from '@/comm/msgs/dev/PiccStateChangedDevMessage';
import GetPiccWebMessage from '@/comm/msgs/web/GetPiccWebMessage';
import ReadSectorWebMessage from '@/comm/msgs/web/ReadSectorWebMessage';
import '@/components/Dashboard/Dashboard.scss';
import Memory from '@/components/Memory/Memory.vue';
import MemoryFocus from '@/components/Memory/MemoryFocus';
import {
  onMemoryByteMouseClick,
  onMemoryByteMouseEnter,
  onMemoryByteMouseLeave
} from '@/components/MemoryByte/hooks/MemoryByteEventHooks';
import SystemInfo from '@/components/SystemInfo/SystemInfo.vue';
import { hex } from '@/helpers';
import { logger } from '@/Logger';
import MifareClassic, {
  MifareClassicBlock,
  MifareClassicBlockGroup,
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { PiccKey, PiccState, PiccType } from '@/models/Picc';
import { inject, onMounted, ref, watch } from 'vue';
import { onMemorySectorUnlock } from '../MemorySector/hooks/MemorySectorEventHooks';
import TargetByte from './TargetByte';
import TargetByteRenderer from './TargetByteRenderer.vue';

enum DashboardState {
  Undefined = 0,
  Initialized,
  PiccFetching,
  PiccNotPresent,
  PiccRemoved,
  PiccPaired,
}

const client = inject('client') as Client;
const state = ref<DashboardState>(DashboardState.Undefined);
const picc = ref<MifareClassic | undefined>(undefined);
const memoryFocus = ref<MemoryFocus | undefined>(undefined);
const tByte = ref<TargetByte | undefined>(undefined);

function fetchSector(sector: MifareClassicSector, key: PiccKey) {
  client.send(ReadSectorWebMessage.from(sector.offset, key));
}

function updateSector(message: PiccSectorDevMessage) {
  picc.value?.memory.updateSector(message.blocks);
}

watch(state, (newState, oldState) => {
  logger.verbose(
    'dashboard state changed',
    'from', DashboardState[oldState],
    'to', DashboardState[newState]
  );

  switch (newState) {
    case DashboardState.Initialized: {
      state.value = DashboardState.PiccFetching;
    } break;
    case DashboardState.PiccFetching: {
      client.send(GetPiccWebMessage.create());
    } break;
  }
});

onMounted(() => {
  state.value = DashboardState.Initialized;
});

onClientMessage(e => {
  if (!HelloDevMessage.is(e.message)) {
    return;
  }

  state.value = DashboardState.Initialized;
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

onMemorySectorUnlock(e => {
  fetchSector(e.sector, e.key);
});

onClientMessage(e => {
  if (!PiccSectorDevMessage.is(e.message)) {
    return;
  }

  updateSector(e.message);
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

      <div v-if="state == DashboardState.PiccFetching">
        <p class="message">checking for a card...</p>
      </div>
      <div v-else-if="state == DashboardState.PiccNotPresent">
        <p class="message">put a card on the reader</p>
      </div>
      <div v-else-if="state == DashboardState.PiccRemoved">
        <p class="message">card removed, put it back please</p>
      </div>

    </div>
    <div class="scene main" v-else-if="state == DashboardState.PiccPaired && picc">

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

        <SystemInfo />
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

            <TargetByteRenderer :byte="tByte as TargetByte" v-if="tByte" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
