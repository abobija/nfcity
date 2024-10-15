<script setup lang="ts">
import MemoryViewer from "@/components/MemoryViewer/MemoryViewer.vue";
import { MifareClassicBlockGroup, MifareClassicBlockGroupType, MifareClassicBlockOperation } from "@/models/MifareClassic";
import { computed } from "vue";

const group = defineModel<MifareClassicBlockGroup>({ required: true });
const key = computed(() => group.value.block.sector.key);
const operations = computed(() => Object.keys(group.value.accessConditions) as MifareClassicBlockOperation[]);
const permissions = computed(() => key.value ? group.value.allowedOperationsFor(key.value) : []);
</script>

<template>
  <section class="GroupInfoRenderer">
    <div class="header prop">
      <div class="name">Group</div>
      <div class="value">
        {{ MifareClassicBlockGroupType[group.type] }}
      </div>
    </div>
    <ul class="props">
      <li class="prop access">
        <div class="name">Access</div>
        <div class="value">
          <span v-for="operation in operations" class="operation" :class="{
            allowed: permissions.includes(operation),
          }">
            {{ operation }}
          </span>
        </div>
      </li>
      <li class="prop">
        <div class="name">Range</div>
        <div class="value">
          <abbr title="from_byte:to_byte">
            {{ group.offset }}:{{ group.offset + group.length - 1 }}
          </abbr>
        </div>
      </li>
      <li class="prop memory">
        <div class="name">Content</div>
        <div class="value">
          <MemoryViewer :group />
        </div>
      </li>
    </ul>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.GroupInfoRenderer {
  .access {
    .operation {
      display: inline-block;

      &:not(:last-child) {
        margin-right: 0.5em;
      }

      &:not(.allowed) {
        text-decoration: line-through;
      }
    }
  }
}
</style>
