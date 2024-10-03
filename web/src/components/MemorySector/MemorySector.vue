<script setup lang="ts">
import MemoryBlock from '@/components/MemoryBlock/MemoryBlock.vue';
import { MemoryBlockByteClickEvent, MemoryBlockByteHoverEvent } from '@/components/MemoryBlock/MemoryBlockEvents';
import '@/components/MemorySector/MemorySector.scss';
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

defineEmits<{
  (e: 'blockByteHover', data: MemoryBlockByteHoverEvent): void;
  (e: 'blockByteClick', data: MemoryBlockByteClickEvent): void;
}>();

const classes = computed(() => ({
  empty: props.sector.isEmpty,
}));

const byteGroupClassMap: Map<MifareClassicBlockByteGroupClass, string> = new Map([
  [MifareClassicBlockByteGroupClass.Undefined, 'undefined'],

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

function blockByteGroups(block?: MifareClassicBlock): MemoryBlockByteGroup[] {
  const byteGroups = block?.byteGroups ?? [{
    offset: 0,
    length: MifareClassicBlock.size,
    class: MifareClassicBlockByteGroupClass.Undefined,
  }];

  return byteGroups.map<MemoryBlockByteGroup>(byteGroup => {
    return {
      origin: byteGroup,
      offset: byteGroup.offset,
      length: byteGroup.length,
      class: byteGroupClassMap.get(byteGroup.class) ?? 'unknown',
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
        :key="blockOffset" :sector="sector" :block="sector.blockAt(blockOffset)"
        :byte-groups="blockByteGroups(sector.blockAt(blockOffset))" @byte-hover="e => $emit('blockByteHover', e)"
        @byte-click="e => $emit('blockByteClick', e)" />
    </div>
  </div>
</template>
