<script setup lang="ts">
import {
  AccessBitsCombo,
  keyTypePermissions,
  MifareClassicKeyPermissions,
  operationShortName
} from '@/models/MifareClassic';
import { KeyType, keyTypeName } from '@/models/Picc';

defineProps<{
  keyType: KeyType;
  accessConditions: Partial<MifareClassicKeyPermissions>;
  accessBitsCombo: AccessBitsCombo;
}>();
</script>

<template>
  <section class="KeyTypePermissions" :class="`key key-${keyTypeName(keyType)}`">
    <span class="name">{{ keyTypeName(keyType) }}</span>
    <span v-for="permission in keyTypePermissions(keyType, accessConditions, accessBitsCombo)" class="operation" :class="{
      allowed: permission.allowed,
    }">
      {{ operationShortName(permission.operation) }}
    </span>
  </section>
</template>

<style lang="scss">
.KeyTypePermissions {
  .name {
    margin-right: 0.5em;
  }
}
</style>
