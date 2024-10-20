<script setup lang="ts">
import { MifareClassicBlockOperation, operationShortName } from "@/models/MifareClassic/MifareClassicAuthorization";
import MifareClassicBlockGroup from "@/models/MifareClassic/MifareClassicBlockGroup";
import { keyTypeName } from "@/models/Picc";
import { computed } from "vue";

const props = defineProps<{
  group: MifareClassicBlockGroup;
}>();

const key = computed(() => props.group.block.sector.key);
const operations = computed(() => Object.keys(props.group.accessConditions) as MifareClassicBlockOperation[]);
const permissions = computed(() => key.value ? props.group.allowedOperationsFor(key.value) : []);
</script>

<template>
  <section class="BlockGroupStatusBarItem">
    <abbr class="name" title="Block Group">G</abbr>
    <ul>
      <li>
        <abbr title="Group Range [FROM_BYTE:TO_BYTE]">
          {{ group.offset }}:{{ group.offset + group.length - 1 }}
        </abbr>
      </li>
      <li title="Group Type">
        {{ group.type }}
      </li>
      <li v-if="key" :title="`Permissions of key ${keyTypeName(key.type)}`">
        <span v-for="operation in operations" class="operation" :class="{
          allowed: permissions.includes(operation),
        }">
          {{ operationShortName(operation) }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@use '@/theme' as *;

.BlockGroupStatusBarItem {
  .operation {
    display: inline-block;
    font-weight: 600;

    &:not(:last-child) {
      margin-right: 0.25em;
    }

    &:not(.allowed) {
      text-decoration: line-through;
    }
  }
}
</style>
