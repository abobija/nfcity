<script setup lang="ts">
import MemoryViewer from "@/components/MemoryViewer/MemoryViewer.vue";
import { MifareClassicBlockGroup, MifareClassicBlockGroupType } from "@/models/MifareClassic";
import ByteRepresentation from "@Memory/ByteRepresentation";
import { computed, ref } from "vue";

const group = defineModel<MifareClassicBlockGroup>({ required: true });
const view = ref(ByteRepresentation.Hexadecimal);
const key = computed(() => group.value.block.sector.key!);
</script>

<template>
  <div class="group renderer component">
    <div class="header">
      Group
    </div>
    <ul class="props">
      <li class="prop">
        <div class="name">Type</div>
        <div class="value">{{ MifareClassicBlockGroupType[group.type] }}</div>
      </li>
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
          [ {{ group.allowedOperationsFor(key).join(', ') }} ]
        </div>
      </li>
      <li class="prop memory">
        <div class="name">Content</div>
        <div class="value">
          <MemoryViewer :view :block="group.block" :offset="group.offset" :length="group.length"
            @view-change-proposal="v => view = v"
            :edit="group.type == MifareClassicBlockGroupType.Data && group.keyCan(key, 'write')" />
        </div>
      </li>
    </ul>
  </div>
</template>
