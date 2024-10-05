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
import MemoryByteEvent from '@/components/MemoryBlock/events/MemoryByteEvent';
import {
  onMemoryByteMouseClick,
  onMemoryByteMouseEnter,
  onMemoryByteMouseLeave
} from '@/components/MemoryBlock/hooks/MemoryByteEventHooks';
import SystemInfo from '@/components/SystemInfo/SystemInfo.vue';
import { bin, hex } from '@/helpers';
import { logger } from '@/Logger';
import MifareClassic, {
  defaultKey,
  MifareClassicBlock,
  MifareClassicBlockGroupType,
  MifareClassicBlockType,
  MifareClassicMemory
} from '@/models/MifareClassic';
import { PiccState, PiccType } from '@/models/Picc';
import { inject, onMounted, ref, watch } from 'vue';

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

const targetByte = ref<MemoryByteEvent | undefined>(undefined); // Hovered byte reference
const isTargetByteLocked = ref<boolean>(false);

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

onClientMessage(e => {
  if (!PiccSectorDevMessage.is(e.message)) {
    return;
  }

  picc.value?.memory.updateSector(e.message.blocks);
});

onMemoryByteMouseEnter(e => {
  logger.verbose('Block byte entered', e);

  if (isTargetByteLocked.value) {
    return;
  }

  targetByte.value = e;
});

onMemoryByteMouseLeave(e => {
  logger.verbose('Block byte left', e);

  if (isTargetByteLocked.value) {
    return;
  }

  targetByte.value = undefined;
});

onMemoryByteMouseClick(e => {
  logger.verbose('Block byte clicked', e);

  const sector = e.block.sector;

  if (sector.isEmpty) {
    client.send(ReadSectorWebMessage.from(sector.offset, defaultKey));
    return;
  }

  if (isTargetByteLocked.value) {
    // Unlockable only by clicking on locked byte
    const isUnlockable =
      e.block.address == targetByte.value?.block.address
      && e.byteIndex === targetByte.value?.byteIndex;

    if (isUnlockable) {
      targetByte.value?.focus(false);
      isTargetByteLocked.value = false;
      return;
    }
  }

  // lock new byte
  targetByte.value?.focus(false);
  targetByte.value = e;
  isTargetByteLocked.value = true;
  targetByte.value?.focus();
});
</script>

<template>
  <div class="dashboard component" :class="{ 'target-byte-locked': isTargetByteLocked }">
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
          <div class="memory txt-nowrap">
            {{ picc.memory.blockDistribution.flatMap(d => `${d[0]} sectors with ${d[1]} blocks`).join(' & ') }}
            >> {{ MifareClassicBlock.size }} bytes per block
            >> {{ picc.memory.size }} bytes of memory
          </div>
        </div>

        <SystemInfo />
      </div>

      <div class="main">
        <div class="section">
          <Memory :memory="picc.memory as MifareClassicMemory" />
        </div>
        <div class="section">
          <div class="info-panel">
            <Transition appear>
              <p class="hint" v-if="picc.memory.isEmpty">
                Click on one of the sectors on the left to load its data.
              </p>
            </Transition>

            <div class="target" v-if="targetByte">
              <ul>
                <li class="item">
                  <span class="name">byte</span>
                  <span class="value" title="index">[{{ targetByte.byteIndex }}]</span>

                  <ul v-if="targetByte.block.type != MifareClassicBlockType.Undefined">
                    <li class="item">
                      <span class="name">value</span>
                      <span class="value">0x{{ hex(targetByte.block.data[targetByte.byteIndex]) }}</span>

                      <ul>
                        <li class="item">
                          <span class="name">dec</span>
                          <span class="value">{{ targetByte.block.data[targetByte.byteIndex] }}</span>
                        </li>
                        <li class="item">
                          <span class="name">bin</span>
                          <span class="value">{{ bin(targetByte.block.data[targetByte.byteIndex], '_')
                            }}</span>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li class="item">
                  <span class="name">block</span>
                  <span class="value">{{ targetByte.block.address }}</span>
                  <span class="name">sector</span>
                  <span class="value">{{ targetByte.block.sector.offset }}</span>

                  <ul>
                    <li class="item" v-if="targetByte.block.type != MifareClassicBlockType.Undefined">
                      <span class="name">type</span>
                      <span class="value">{{ MifareClassicBlockType[targetByte.block.type] }}</span>
                    </li>
                    <li class="item">
                      <span class="name">address</span>
                      <span class="value">0x{{ hex(targetByte.block.address) }}</span>
                      <span class="name">offset</span>
                      <span class="value">{{ targetByte.block.offset }}</span>
                    </li>
                    <li class="item">
                      <span class="name">access bits</span>
                      <span class="value" title="c1 c2 c3">
                        {{ targetByte.block.accessBits.c1 }}
                        {{ targetByte.block.accessBits.c2 }}
                        {{ targetByte.block.accessBits.c3 }}
                      </span>
                    </li>
                  </ul>
                </li>
                <li class="item">
                  <span class="name">byte group</span>
                  <span class="value">{{ MifareClassicBlockGroupType[targetByte.blockGroup.type] }}</span>

                  <ul>
                    <li class="item">
                      <span class="name">offset</span>
                      <span class="value">{{ targetByte.blockGroup.offset }}</span>
                      <span class="name">length</span>
                      <span class="value">{{ targetByte.blockGroup.length }}</span>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
