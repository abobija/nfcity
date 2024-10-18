<script setup lang="ts">
import { AccessBitsCombo, AccessBitsPoolIndex, calculateAccessBitsFromCombo, dataBlockAccessConditions, isValueBlock, keyTypePermissions, operationShortName, valueBlockAccessConditions } from '@/models/MifareClassic';
import { keyA, keyB } from '@/models/Picc';
import { computed } from 'vue';

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
      TODO: trailer
    </div>
    <div v-else-if="dataBlockAC" class="block data">
      <div class="key key-a">
        <span class="name">A</span>
        <span v-for="permission in keyTypePermissions(keyA, dataBlockAC, accessBitsCombo)" class="operation" :class="{
          allowed: permission.allowed,
        }">
          {{ operationShortName(permission.operation) }}
        </span>
      </div>
      <div class="key key-b">
        <span class="name">B</span>
        <span v-for="permission in keyTypePermissions(keyB, dataBlockAC, accessBitsCombo)" class="operation" :class="{
          allowed: permission.allowed,
        }">
          {{ operationShortName(permission.operation) }}
        </span>
      </div>
    </div>
  </section>
</template>

<style lang="scss">
.AccessConditionsDescriptionRenderer {
  display: inline;

  .block {
    display: flex;

    .key {
      &:not(:first-child) {
        margin-left: 1em;
      }

      .name {
        margin-right: 0.5em;
        font-weight: 600;
      }
    }
  }

  .operation:not(.allowed) {
    text-decoration: line-through;
  }
}
</style>
