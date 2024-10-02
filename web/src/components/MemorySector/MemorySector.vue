<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import MemoryBlockClickEvent from '@/components/MemoryBlock/MemoryBlockClickEvent';
import '@/components/MemorySector/MemorySector.scss';
import MemorySectorClickEvent from '@/components/MemorySector/MemorySectorClickEvent';
import {
  MifareClassicBlock,
  MifareClassicBlockByteGroupClass,
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryBlockByteGroup from '../MemoryBlock/MemoryBlockByteGroup';

const props = defineProps<{
  sector: MifareClassicSector;
}>();

const emit = defineEmits<{
  (e: 'click', data: MemorySectorClickEvent): void;
  (e: 'blockClick', data: MemoryBlockClickEvent): void;
}>();

const onBlockClick = (e: MemoryBlockClickEvent) => emit('blockClick', e);

const classes = computed(() => ({
  empty: props.sector.isEmpty,
}));

const byteGroupClassMap: Map<MifareClassicBlockByteGroupClass, string> = new Map([
  // Trailer
  [MifareClassicBlockByteGroupClass.KeyA, 'key key-a'],
  [MifareClassicBlockByteGroupClass.AccessBits, 'access-bits'],
  [MifareClassicBlockByteGroupClass.UserByte, 'user-byte'],
  [MifareClassicBlockByteGroupClass.KeyB, 'key key-b'],

  // Value
  [MifareClassicBlockByteGroupClass.Value, 'value'],
  [MifareClassicBlockByteGroupClass.ValueInverted, 'value-inverted'],
  [MifareClassicBlockByteGroupClass.Address, 'addr'],
  [MifareClassicBlockByteGroupClass.AddressInverted, 'addr-inverted'],

  // Data
  [MifareClassicBlockByteGroupClass.Data, 'data'],

  // Manufacturer
  [MifareClassicBlockByteGroupClass.UID, 'uid'],
  [MifareClassicBlockByteGroupClass.BCC, 'bcc'],
  [MifareClassicBlockByteGroupClass.SAK, 'sak'],
  [MifareClassicBlockByteGroupClass.ATQA, 'atqa'],
  [MifareClassicBlockByteGroupClass.ManufacturerData, 'manufacturer'],
]);

function blockByteGroups(block?: MifareClassicBlock): MemoryBlockByteGroup[] | undefined {
  if (!block) return;

  return block.byteGroups.map<MemoryBlockByteGroup>(byteGroup => {
    return {
      offset: byteGroup.offset,
      length: byteGroup.length,
      class: byteGroupClassMap.get(byteGroup.class) ?? 'unknown',
    };
  });
}
</script>

<template>
  <div class="sector" :class="classes" @click="$emit('click', { sector })">
    <div class="meta">
      <span class="offset">{{ sector.offset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocks(sector.offset) })"
        :key="blockOffset" :block="sector.blockAt(blockOffset)"
        :byte-groups="blockByteGroups(sector.blockAt(blockOffset))" @click="onBlockClick" />
    </div>
  </div>
</template>
