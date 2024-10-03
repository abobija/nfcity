<script setup lang="ts">
import Client from '@/comm/Client';
import { isPiccBlockDevMessage } from '@/comm/msgs/dev/PiccBlockDevMessage';
import { isPiccSectorDevMessage } from '@/comm/msgs/dev/PiccSectorDevMessage';
import '@/components/Dashboard/Dashboard.scss';
import Memory from '@/components/Memory/Memory.vue';
import memoryBlockEmits, {
  MemoryBlockByteEvent
} from '@/components/MemoryBlock/MemoryBlockEvents';
import { bin, hex } from '@/helpers';
import onDeviceMessage from '@/hooks/onDeviceMessage';
import { logger } from '@/Logger';
import MifareClassic, { defaultKey, MifareClassicBlock, MifareClassicBlockByteGroupType, MifareClassicBlockType } from '@/models/MifareClassic';
import { PiccType } from '@/models/Picc';
import { inject, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  picc: MifareClassic;
}>();

const client = inject('client') as Client;
const targetByte = ref<MemoryBlockByteEvent | undefined>(undefined); // Hovered byte reference
const isTargetByteLocked = ref<boolean>(false);

function onBlockByteEnter(e: MemoryBlockByteEvent) {
  logger.verbose('Block byte entered', e);

  if (isTargetByteLocked.value) {
    return;
  }

  targetByte.value = e;
}

function onBlockByteLeave(e: MemoryBlockByteEvent) {
  logger.verbose('Block byte left', e);

  if (isTargetByteLocked.value) {
    return;
  }

  targetByte.value = undefined;
}

function onBlockByteClick(e: MemoryBlockByteEvent) {
  logger.verbose('Block byte clicked', e);

  const sector = e.block.sector;

  if (sector.isEmpty) {
    client.readSector({
      offset: sector.offset,
      key: defaultKey,
    });

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
}

onMounted(() => {
  memoryBlockEmits.on('byteEnter', onBlockByteEnter);
  memoryBlockEmits.on('byteLeave', onBlockByteLeave);
  memoryBlockEmits.on('byteClick', onBlockByteClick);
});

onUnmounted(() => {
  memoryBlockEmits.off('byteEnter', onBlockByteEnter);
  memoryBlockEmits.off('byteLeave', onBlockByteLeave);
  memoryBlockEmits.off('byteClick', onBlockByteClick);
});

onDeviceMessage(message => {
  if (!isPiccBlockDevMessage(message)) {
    return;
  }

  logger.warning('Unhandled reception of single block', message.block);
});

onDeviceMessage(message => {
  if (!isPiccSectorDevMessage(message)) {
    return;
  }

  props.picc.memory.updateSector(message.blocks);
});
</script>

<template>
  <div class="dashboard component" :class="{ 'target-byte-locked': isTargetByteLocked }">
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
    </div>

    <div class="main">
      <div class="section">
        <Memory :memory="picc.memory" />
      </div>
      <div class="section">
        <div class="info-panel">
          <Transition appear>
            <p class="hint" v-if="picc.memory.isEmpty">
              Click on one of the sectors on the left to load its data. </p>
          </Transition>

          <div class="target" v-if="targetByte">
            <ul>
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
                    <span class="name">byte</span>
                    <span class="value">{{ targetByte.byteIndex }}</span>

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
                    <span class="name">byte_group</span>
                    <span class="value">{{ MifareClassicBlockByteGroupType[targetByte.byteGroup.type] }}</span>

                    <ul>
                      <li class="item">
                        <span class="name">offset</span>
                        <span class="value">{{ targetByte.byteGroup.offset }}</span>
                        <span class="name">length</span>
                        <span class="value">{{ targetByte.byteGroup.length }}</span>
                      </li>
                      <li class="item">
                        <div class="rendered">
                          TODO: render byte group
                        </div>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
