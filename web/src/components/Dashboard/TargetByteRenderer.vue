<script setup lang="ts">
import '@/components/Dashboard/TargetByteRenderer.scss';
import '@/components/MemoryBlock/MemoryBlock.scss';
import { bin, hex } from '@/helpers';
import { MifareClassicBlockGroupType, MifareClassicBlockType } from '@/models/MifareClassic';
import { computed } from 'vue';
import TargetByte from './TargetByte';

const props = defineProps<{
  byte: TargetByte;
}>();

const group = computed(() => props.byte.group);
const block = computed(() => props.byte.group.block);
</script>

<template>
  <div class="target-byte-renderer component">
    <ul>
      <li class="item">
        <span class="name">byte</span>
        <span class="value" title="index">[{{ byte.index }}]</span>

        <ul v-if="block.type != MifareClassicBlockType.Undefined">
          <li class="item">
            <span class="name">value</span>
            <span class="value">0x{{ hex(block.data[byte.index]) }}</span>

            <ul>
              <li class="item">
                <span class="name">dec</span>
                <span class="value">{{ block.data[byte.index] }}</span>
              </li>
              <li class="item">
                <span class="name">bin</span>
                <span class="value">{{ bin(block.data[byte.index], '_')
                  }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
      <li class="item">
        <span class="name">block</span>
        <span class="value">{{ block.address }}</span>
        <span class="name">sector</span>
        <span class="value">{{ block.sector.offset }}</span>

        <ul>
          <li class="item" v-if="block.type != MifareClassicBlockType.Undefined">
            <span class="name">type</span>
            <span class="value">{{ MifareClassicBlockType[block.type] }}</span>
          </li>
          <li class="item">
            <span class="name">address</span>
            <span class="value">0x{{ hex(block.address) }}</span>
            <span class="name">offset</span>
            <span class="value">{{ block.offset }}</span>
          </li>
          <li class="item">
            <span class="name">access bits</span>
            <span class="value" title="c1 c2 c3">
              {{ block.accessBits.c1 }}
              {{ block.accessBits.c2 }}
              {{ block.accessBits.c3 }}
            </span>
          </li>
        </ul>
      </li>
      <li class="item">
        <span class="name">byte group</span>
        <span class="value">{{ MifareClassicBlockGroupType[group.type] }}</span>

        <ul>
          <li class="item">
            <span class="name">offset</span>
            <span class="value">{{ group.offset }}</span>
            <span class="name">length</span>
            <span class="value">{{ group.length }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
