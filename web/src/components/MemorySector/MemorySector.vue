<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import '@/components/MemorySector/MemorySector.scss';
import {
  MifareClassicBlock,
  MifareClassicBlockByteGroupType,
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { computed } from 'vue';
import MemoryBlockByteGroup from '../MemoryBlock/MemoryBlockByteGroup';

const props = defineProps<{
  sector: MifareClassicSector;
}>();

const classes = computed(() => ({
  empty: props.sector.isEmpty,
}));

const byteGroupClassMap: Map<MifareClassicBlockByteGroupType, string> = new Map([
  [MifareClassicBlockByteGroupType.Undefined, 'undefined'],

  // Trailer
  [MifareClassicBlockByteGroupType.KeyA, 'key key-a'],
  [MifareClassicBlockByteGroupType.AccessBits, 'access-bits'],
  [MifareClassicBlockByteGroupType.UserByte, 'user-byte'],
  [MifareClassicBlockByteGroupType.KeyB, 'key key-b'],

  // Value
  [MifareClassicBlockByteGroupType.Value, 'value'],
  [MifareClassicBlockByteGroupType.ValueInverted, 'value-inverted'],
  [MifareClassicBlockByteGroupType.Address, 'addr'],
  [MifareClassicBlockByteGroupType.AddressInverted, 'addr-inverted'],

  // Data
  [MifareClassicBlockByteGroupType.Data, 'data'],

  // Manufacturer
  [MifareClassicBlockByteGroupType.UID, 'uid'],
  [MifareClassicBlockByteGroupType.BCC, 'bcc'],
  [MifareClassicBlockByteGroupType.SAK, 'sak'],
  [MifareClassicBlockByteGroupType.ATQA, 'atqa'],
  [MifareClassicBlockByteGroupType.ManufacturerData, 'manufacturer'],
]);

function blockByteGroups(block?: MifareClassicBlock): MemoryBlockByteGroup[] {
  const byteGroups = block?.byteGroups ?? [{
    offset: 0,
    length: MifareClassicBlock.size,
    type: MifareClassicBlockByteGroupType.Undefined,
  }];

  return byteGroups.map<MemoryBlockByteGroup>(byteGroup => {
    return {
      origin: byteGroup,
      offset: byteGroup.offset,
      length: byteGroup.length,
      class: byteGroupClassMap.get(byteGroup.type) ?? 'unknown',
    };
  });
}
</script>

<template>
  <div class="sector component" :class="classes">
    <div class="meta">
      <span class="offset">{{ sector.offset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock
        v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocksInSector(sector.offset) })"
        :key="blockOffset" :block="sector.blockAt(blockOffset)"
        :byte-groups="blockByteGroups(sector.blockAt(blockOffset))" />
    </div>
  </div>
</template>
