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
      <div class="value">{{ MifareClassicBlockGroupType[group.type] }}</div>
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Offset</div>
        <div class="value">{{ group.offset }}</div>
      </li>
      <li class="prop">
        <div class="name">Length</div>
        <div class="value">{{ group.length }}</div>
      </li>
      <li class="prop">
        <div class="name">Access</div>
        <div class="value">
          Permissions
          [ {{ permissions.join(', ') }} ]
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
