<script setup lang="ts">
import MemoryViewer from "@/components/MemoryViewer/MemoryViewer.vue";
import { MifareClassicBlockGroup, MifareClassicBlockGroupType } from "@/models/MifareClassic";
import ByteRepresentation from "@Memory/ByteRepresentation";
import { computed, ref } from "vue";

const group = defineModel<MifareClassicBlockGroup>({ required: true });
const view = ref(ByteRepresentation.Hexadecimal);
const key = computed(() => group.value.block.sector.key);
const permissions = computed(() => key.value ? group.value.allowedOperationsFor(key.value) : []);
</script>

<template>
  <div class="group renderer component">
    <div class="header prop">
      <div class="name">Group</div>
      <div class="value">
        {{ MifareClassicBlockGroupType[group.type] }}
      </div>
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Access</div>
        <div class="value">
          <span v-if="permissions.length === 0">no-access</span>
          <span v-else>
            {{ permissions.join(', ') }}
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
          <MemoryViewer :view :group @view-change-proposal="v => view = v" />
        </div>
      </li>
    </ul>
  </div>
</template>
