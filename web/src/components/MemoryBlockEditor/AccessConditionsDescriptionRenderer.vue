<script setup lang="ts">
import KeyTypePermissions from "@/components/MemoryBlockEditor/KeyTypePermissions.vue";
import { dataBlockAccessConditions } from "@/models/MifareClassic/blocks/MifareClassicDataBlock";
import { sectorTrailerAccessConditions } from "@/models/MifareClassic/blocks/MifareClassicSectorTrailerBlock";
import { isValueBlock, valueBlockAccessConditions } from "@/models/MifareClassic/blocks/MifareClassicValueBlock";
import { AccessBitsCombo, AccessBitsPoolIndex, calculateAccessBitsFromCombo } from "@/models/MifareClassic/MifareClassicAuthorization";
import { keyA, keyB } from "@/models/Picc";
import { computed } from "vue";

const props = defineProps<{
  accessBitsPoolIndex: AccessBitsPoolIndex;
  accessBitsCombo: AccessBitsCombo;
}>();

const dataBlockAC = computed(() => {
  if (props.accessBitsPoolIndex === 3) {
    return undefined;
  }

  if (isValueBlock(calculateAccessBitsFromCombo(props.accessBitsCombo))) {
    return valueBlockAccessConditions;
  }

  return dataBlockAccessConditions;
});
</script>

<template>
  <section class="AccessConditionsDescriptionRenderer">
    <div v-if="accessBitsPoolIndex === 3" class="block trailer">
      <div v-for="group in sectorTrailerAccessConditions" class="group">
        <span class="name">{{ group[0] }}</span>

        <KeyTypePermissions :key-type="keyA" :access-conditions="group[1]" :access-bits-combo="accessBitsCombo" />
        <KeyTypePermissions :key-type="keyB" :access-conditions="group[1]" :access-bits-combo="accessBitsCombo" />
      </div>
    </div>
    <div v-else-if="dataBlockAC" class="block data">
      <KeyTypePermissions :key-type="keyA" :access-conditions="dataBlockAC" :access-bits-combo="accessBitsCombo" />
      <KeyTypePermissions :key-type="keyB" :access-conditions="dataBlockAC" :access-bits-combo="accessBitsCombo" />
    </div>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.AccessConditionsDescriptionRenderer {
  display: inline;

  .block.trailer {
    display: flex;

    .group:not(:first-child) {
      margin-left: 1em;
      padding-left: 1em;
      border-left: 1px solid color.adjust($color-4, $alpha: -0.7);
    }
  }

  .operation:not(:first-child) {
    margin-left: .1em;
  }

  .operation.allowed {
    font-weight: bold;
    color: $color-1;
  }

  .operation:not(.allowed) {
    text-decoration: line-through;
    opacity: .5;
  }
}
</style>
