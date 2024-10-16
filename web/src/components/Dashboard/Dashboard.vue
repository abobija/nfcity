<script setup lang="ts">
import onClientMessage from "@/communication/composables/onClientMessage";
import onClientOffline from "@/communication/composables/onClientOffline";
import onClientPongMissed from "@/communication/composables/onClientPongMissed";
import onClientReady from "@/communication/composables/onClientReady";
import { isHelloDeviceMessage } from "@/communication/messages/device/HelloDeviceMessage";
import { isPiccDeviceMessage } from "@/communication/messages/device/PiccDeviceMessage";
import { isPiccStateChangedDeviceMessage } from "@/communication/messages/device/PiccStateChangedDeviceMessage";
import GetPiccWebMessage from "@/communication/messages/web/GetPiccWebMessage";
import '@/components/Dashboard/Dashboard.scss';
import BlockInfoRenderer from "@/components/Dashboard/infoRenderers/BlockInfoRenderer.vue";
import ByteInfoRenderer from "@/components/Dashboard/infoRenderers/ByteInfoRenderer.vue";
import GroupInfoRenderer from "@/components/Dashboard/infoRenderers/GroupInfoRenderer.vue";
import SectorInfoRenderer from "@/components/Dashboard/infoRenderers/SectorInfoRenderer.vue";
import TargetByte from "@/components/Dashboard/TargetByte";
import SystemInfo from "@/components/SystemInfo/SystemInfo.vue";
import useClient from "@/composables/useClient";
import MifareClassic, {
  blockSize,
  MifareClassicBlock,
  MifareClassicBlockGroup,
  MifareClassicMemory,
  MifareClassicSector
} from "@/models/MifareClassic";
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
const tByte = ref<TargetByte | undefined>(undefined);
const retryMax = ref(5);
const retryCount = ref(0);
const checkingForReaderCancelationToken = ref<CancelationToken>();
const pingCancelationToken = ref<CancelationToken>();
const overlay = ref(true);

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
  tByte.value = undefined;
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

  if (!isHelloDeviceMessage(e.message)) {
    return;
  }

  if (state.value >= DashboardState.PiccPaired) {
    client.value.send(new GetPiccWebMessage());
  }
  else if (state.value > DashboardState.CeckingForPicc) {
    state.value = DashboardState.CeckingForPicc;
  } else {
    state.value = DashboardState.CheckingForReader;
  }
});

onClientMessage(e => {
  const { message } = e;

  if (!isPiccDeviceMessage(message) && !isPiccStateChangedDeviceMessage(message)) {
    return;
  }

  const piccDto = message.picc;

  if (piccDto.type === PiccType.Undefined) {
    // ignore, device did not scanned a single picc yet
    return;
  }

  if (!MifareClassic.isMifareClassic(piccDto)) {
    logger.error('unsupported PICC type', PiccType[piccDto.type]);
    state.value = DashboardState.Exit;
    return;
  }

  if (picc.value === undefined || (picc.value.id !== MifareClassic.calculateId(piccDto))) {
    picc.value = MifareClassic.fromDto(piccDto);
  } else { // Same card
    picc.value.state = piccDto.state;
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
});

onByteMouseEnter(e => {
  if (!e.group.block.loaded) {
    return;
  }

  if (tByte.value?.locked) {
    return;
  }

  tByte.value = {
    index: e.index,
    group: e.group,
    locked: false,
  };
});

onByteMouseLeave((e) => {
  if (!e.group.block.loaded) {
    return;
  }

  if (tByte.value?.locked) {
    return;
  }

  tByte.value = undefined;
});

onByteMouseClick(clickedByte => {
  if (!clickedByte.group.block.loaded) {
    return;
  }

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
  <section class="Dashboard">

    <main v-if="picc">
      <div class="header">
        <div class="picc" :key="picc.id">
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

        <div class="misc">
          <SystemInfo />
        </div>
      </div>

      <div class="main" :key="picc.id">
        <div class="section memory">
          <Memory :memory="picc.memory as MifareClassicMemory" :focus="memoryFocus as MemoryFocus | undefined" />
        </div>
        <div class="section info">
          <div class="info-panel">
            <Transition appear>
              <div v-if="picc.memory.isEmpty">
                <p>
                  {{ PiccType[picc.type] }} has
                </p>
                <p v-for="(d) in picc.memory.blockDistribution">
                  {{ d[0] }} sectors with {{ d[1] }} blocks,
                </p>
                <p>{{ blockSize }} bytes per block,</p>
                <p>{{ picc.memory.size }} bytes of memory.</p>
              </div>
            </Transition>

            <div v-if="tByte">
              <BlockInfoRenderer class="InfoRenderer" :block="tByte.group.block as MifareClassicBlock" />
              <GroupInfoRenderer class="InfoRenderer" v-model="tByte.group as MifareClassicBlockGroup" />
              <SectorInfoRenderer class="InfoRenderer" :sector="tByte.group.block.sector as MifareClassicSector" />
              <ByteInfoRenderer class="InfoRenderer" :byte="tByte as TargetByte" />
            </div>
          </div>
        </div>
      </div>
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
