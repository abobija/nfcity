<script setup lang="ts">
import '@/components/Dashboard/TargetByteRenderer.scss';
import '@/components/MemoryBlock/MemoryBlock.scss';
import { bin, hex } from '@/helpers';
import { MifareClassicBlockGroupType, MifareClassicBlockType } from '@/models/MifareClassic';
import TargetByte from './TargetByte';

defineProps<{
  byte: TargetByte;
}>();
</script>

<template>
  <div class="target-byte-renderer component">
    <ul>
      <li class="item">
        <span class="name">byte</span>
        <span class="value" title="index">[{{ byte.index }}]</span>

        <ul v-if="byte.group.block.type != MifareClassicBlockType.Undefined">
          <li class="item">
            <span class="name">value</span>
            <span class="value">0x{{ hex(byte.group.block.data[byte.index]) }}</span>

            <ul>
              <li class="item">
                <span class="name">dec</span>
                <span class="value">{{ byte.group.block.data[byte.index] }}</span>
              </li>
              <li class="item">
                <span class="name">bin</span>
                <span class="value">{{ bin(byte.group.block.data[byte.index], '_')
                  }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </li>
      <li class="item">
        <span class="name">block</span>
        <span class="value">{{ byte.group.block.address }}</span>
        <span class="name">sector</span>
        <span class="value">{{ byte.group.block.sector.offset }}</span>

        <ul>
          <li class="item" v-if="byte.group.block.type != MifareClassicBlockType.Undefined">
            <span class="name">type</span>
            <span class="value">{{ MifareClassicBlockType[byte.group.block.type] }}</span>
          </li>
          <li class="item">
            <span class="name">address</span>
            <span class="value">0x{{ hex(byte.group.block.address) }}</span>
            <span class="name">offset</span>
            <span class="value">{{ byte.group.block.offset }}</span>
          </li>
          <li class="item">
            <span class="name">access bits</span>
            <span class="value" title="c1 c2 c3">
              {{ byte.group.block.accessBits.c1 }}
              {{ byte.group.block.accessBits.c2 }}
              {{ byte.group.block.accessBits.c3 }}
            </span>
          </li>
        </ul>
      </li>
      <li class="item">
        <span class="name">byte group</span>
        <span class="value">{{ MifareClassicBlockGroupType[byte.group.type] }}</span>

        <ul>
          <li class="item">
            <span class="name">offset</span>
            <span class="value">{{ byte.group.offset }}</span>
            <span class="name">length</span>
            <span class="value">{{ byte.group.length }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
