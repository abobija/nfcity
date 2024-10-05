<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import MemoryBlockGroup from '@/components/MemoryBlock/MemoryBlockGroup';
import '@/components/MemorySector/MemorySector.scss';
import {
  MifareClassicBlock,
  MifareClassicBlockGroup,
  MifareClassicBlockGroupType,
  MifareClassicMemory,
  MifareClassicSector
} from '@/models/MifareClassic';
import { computed } from 'vue';

const props = defineProps<{
  sector: MifareClassicSector;
}>();

const classes = computed(() => ({
  empty: props.sector.isEmpty,
}));

const blockGroupClassMap: Map<MifareClassicBlockGroupType, string> = new Map([
  [MifareClassicBlockGroupType.Undefined, 'undefined'],

  // Trailer
  [MifareClassicBlockGroupType.KeyA, 'key key-a'],
  [MifareClassicBlockGroupType.AccessBits, 'access-bits'],
  [MifareClassicBlockGroupType.UserByte, 'user-byte'],
  [MifareClassicBlockGroupType.KeyB, 'key key-b'],

  // Value
  [MifareClassicBlockGroupType.Value, 'value'],
  [MifareClassicBlockGroupType.ValueInverted, 'value-inverted'],
  [MifareClassicBlockGroupType.Address, 'addr'],
  [MifareClassicBlockGroupType.AddressInverted, 'addr-inverted'],

  // Data
  [MifareClassicBlockGroupType.Data, 'data'],

  // Manufacturer
  [MifareClassicBlockGroupType.UID, 'uid'],
  [MifareClassicBlockGroupType.BCC, 'bcc'],
  [MifareClassicBlockGroupType.SAK, 'sak'],
  [MifareClassicBlockGroupType.ATQA, 'atqa'],
  [MifareClassicBlockGroupType.ManufacturerData, 'manufacturer'],
]);

function blockGroups(block?: MifareClassicBlock): MemoryBlockGroup[] {
  const blockGroups: MifareClassicBlockGroup[] = block?.blockGroups ?? [
    MifareClassicBlockGroup.from(MifareClassicBlockGroupType.Undefined, 0, MifareClassicBlock.size),
  ];

  return blockGroups.map<MemoryBlockGroup>(blockGroup => {
    return {
      origin: blockGroup,
      offset: blockGroup.offset,
      length: blockGroup.length,
      class: blockGroupClassMap.get(blockGroup.type) ?? 'unknown',
    };
  });
}
</script>

<template>
  <div class="memory-sector component" :class="classes">
    <div class="meta">
      <span class="offset">{{ sector.offset }}</span>
    </div>
    <div class="blocks">
      <MemoryBlock
        v-for="(_, blockOffset) in Array.from({ length: MifareClassicMemory.numberOfBlocksInSector(sector.offset) })"
        :key="blockOffset" :block="sector.blockAt(blockOffset)"
        :blockGroups="blockGroups(sector.blockAt(blockOffset))" />
    </div>
  </div>
</template>
