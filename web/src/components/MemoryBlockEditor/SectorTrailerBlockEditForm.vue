<script setup lang="ts">
import { keySize, MifareClassicBlock, MifareClassicBlockGroupType } from '@/models/MifareClassic';
import { computed } from 'vue';
import BytesInput from '../BytesInput/BytesInput.vue';

const props = defineProps<{
  block: MifareClassicBlock;
}>();

const editingBytes = defineModel<number[]>({ required: true });
const key = computed(() => props.block.sector.key);
const canWrite = computed(() => (key.value === undefined ? undefined : {
  keyA: props.block.findGroup(MifareClassicBlockGroupType.KeyA)?.keyCan(key.value, 'write') === true,
  accessBits: props.block.findGroup(MifareClassicBlockGroupType.AccessBits)?.keyCan(key.value, 'write') === true,
  userByte: props.block.findGroup(MifareClassicBlockGroupType.UserByte)?.keyCan(key.value, 'write') === true,
  keyB: props.block.findGroup(MifareClassicBlockGroupType.KeyB)?.keyCan(key.value, 'write') === true,
}));
</script>

<template>
  <div class="form-group">
    <BytesInput v-model="editingBytes" :offset="0" :length="keySize" placeholder="Key A" :readonly="!canWrite?.keyA" />
  </div>
  <div class="form-group">
    <BytesInput v-model="editingBytes" :offset="keySize + 4" placeholder="Key B" :readonly="!canWrite?.keyB" />
  </div>
  <div class="form-group">
    <BytesInput v-model="editingBytes" :offset="keySize + 3" :length="1" placeholder="User byte"
      :readonly="!canWrite?.userByte" />
  </div>
</template>
