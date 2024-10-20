<script setup lang="ts">
import BytesInput from "@/components/BytesInput/BytesInput.vue";
import AccessBitsComboSwitcher from "@/components/MemoryBlockEditor/AccessBitsComboSwitcher.vue";
import AccessConditionsDescriptionRenderer from "@/components/MemoryBlockEditor/AccessConditionsDescriptionRenderer.vue";
import {
  AccessBitsComboPool,
  accessBitsComboPoolToBytes,
  accessBitsPoolFromSectorTrailerData,
  AccessBitsPoolIndex, calculateAccessBitsCombo,
  isAccessBitsPoolIndex,
  keySize
} from "@/models/MifareClassic/MifareClassicAuthorization";
import MifareClassicSectorTrailerBlock from "@/models/MifareClassic/blocks/MifareClassicSectorTrailerBlock";
import { assert } from "@vue/compiler-core";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  block: MifareClassicSectorTrailerBlock;
}>();

const editingBytes = defineModel<number[]>({ required: true });
const editingBytesOrigin = ref(Array.from(editingBytes.value));
const key = computed(() => props.block.sector.key);
const canWrite = computed(() => (key.value === undefined ? undefined : {
  keyA: props.block.findGroup('KeyA')?.keyCan(key.value, 'write') === true,
  accessBits: props.block.findGroup('AccessBits')?.keyCan(key.value, 'write') === true,
  userByte: props.block.findGroup('UserByte')?.keyCan(key.value, 'write') === true,
  keyB: props.block.findGroup('KeyB')?.keyCan(key.value, 'write') === true,
}));
const accessBitsPool = computed(() => accessBitsPoolFromSectorTrailerData(editingBytesOrigin.value));
const comboPoolArray = [
  ref(calculateAccessBitsCombo(accessBitsPool.value[0])),
  ref(calculateAccessBitsCombo(accessBitsPool.value[1])),
  ref(calculateAccessBitsCombo(accessBitsPool.value[2])),
  ref(calculateAccessBitsCombo(accessBitsPool.value[3])),
];

function poolIndexTitle(index: AccessBitsPoolIndex) {
  assert(isAccessBitsPoolIndex(index));

  if (index === 3) {
    return 'Sector Trailer';
  }

  const { numberOfBlocks } = props.block.sector;

  if (numberOfBlocks > 4) {
    switch (index) {
      case 2: return 'Blocks 10-14';
      case 1: return 'Blocks 5-9';
      case 0: return 'Blocks 0-4';
    }
  }

  return `Block ${index}`;
}

watch(comboPoolArray, (newComboPoolArray) => {
  const newComboPool = Object.fromEntries(
    newComboPoolArray.map((combo, index) => [index, combo])
  ) as AccessBitsComboPool;

  const accessBitsBytes = accessBitsComboPoolToBytes(newComboPool);

  editingBytes.value = [
    ...editingBytes.value.slice(0, keySize),
    ...accessBitsBytes,
    ...editingBytes.value.slice(keySize + accessBitsBytes.length),
  ];
});
</script>

<template>
  <div class="SectorTrailerBlockEditForm">
    <div class="form-group">
      <BytesInput class="key" v-model="editingBytes" :offset="0" :length="keySize" placeholder="Key A"
        :readonly="!canWrite?.keyA" />

      <BytesInput class="key" v-model="editingBytes" :offset="keySize + 4" placeholder="Key B"
        :readonly="!canWrite?.keyB" />
    </div>
    <div class="form-group">
      <BytesInput class="user-byte" v-model="editingBytes" :offset="keySize + 3" :length="1" placeholder="User byte"
        :readonly="!canWrite?.userByte" />
    </div>
    <div class="form-group access-bits">
      <header>Access Bits and Conditions</header>
      <ul>
        <li class="pool-index" :data-index="index" v-for="index in ([3, 2, 1, 0] as AccessBitsPoolIndex[])">
          <AccessBitsComboSwitcher :pool-index="index" v-model="comboPoolArray[index].value"
            :readonly="!canWrite?.accessBits" />

          <div class="conditions">
            <div class="title">
              {{ poolIndexTitle(index) }}
            </div>

            <AccessConditionsDescriptionRenderer :access-bits-pool-index="index"
              :access-bits-combo="comboPoolArray[index].value" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@use '@/theme' as *;

.SectorTrailerBlockEditForm {
  .form-group:not(:first-child) {
    margin-top: 1rem;
  }

  .BytesInput.key {
    width: 10rem;

    &:not(:last-child) {
      margin-right: .5rem;
    }
  }

  .BytesInput.user-byte {
    width: 7rem;
  }

  .access-bits {
    margin: .7rem 0 1.5rem 0;

    >header {
      margin-bottom: .5rem;
    }

    .pool-index {
      display: flex;
      align-items: center;

      &:not(:first-child) {
        margin-top: 1rem;
      }

      >*:not(:last-child) {
        margin-right: 1rem;
      }

      .AccessBitsComboSwitcher {
        button {
          font-size: .8rem !important;
          padding: .2rem .4rem !important;
        }
      }

      .conditions {
        font-size: .8rem;

        >.title {
          margin-bottom: .2rem;
        }

        >.title,
        .group>.name {
          font-weight: 600;
        }
      }
    }
  }
}
</style>
