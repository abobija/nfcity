<script setup lang="ts">
import MemoryEditor from "@/components/MemoryEditor/MemoryEditor.vue";
import { MifareClassicBlockGroup, MifareClassicBlockGroupType } from "@/models/MifareClassic";
import { keyTypeName } from "@/models/Picc";
import { ascii, bin, hex, isAsciiPrintable } from "@/utils/helpers";
import ByteRepresentation from "@Memory/ByteRepresentation";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  group: MifareClassicBlockGroup;
  view?: ByteRepresentation;
}>();

defineEmits<{
  (e: 'viewChangeProposal', viewProposal: ByteRepresentation): void;
}>();

const block = computed(() => props.group.block);
const key = computed(() => block.value.sector.key);
const bytes = computed(() => props.group.data());
const computedView = computed(() => props.view ?? ByteRepresentation.Hexadecimal);
const editable = computed(() => {
  return props.group.type === MifareClassicBlockGroupType.Data
    && key.value !== undefined
    && props.group.keyCan(key.value, 'write');
});
const editMode = ref(false);

watch(() => props.group, () => editMode.value = false);
</script>

<template>
  <section class="MemoryViewer">
    <header>
      <div v-if="!editMode" class="toolbar">
        <div class="view group">
          <div class="btn-group">
            <button class="btn primary" :class="{ activated: computedView === ByteRepresentation.Hexadecimal }"
              @click="$emit('viewChangeProposal', ByteRepresentation.Hexadecimal)">hex</button>
            <button class="btn primary" :class="{ activated: computedView === ByteRepresentation.Binary }"
              @click="$emit('viewChangeProposal', ByteRepresentation.Binary)">bin</button>
            <button class="btn primary" :class="{ activated: computedView === ByteRepresentation.Decimal }"
              @click="$emit('viewChangeProposal', ByteRepresentation.Decimal)">dec</button>
            <button class="btn primary" :class="{ activated: computedView === ByteRepresentation.Ascii }"
              @click="$emit('viewChangeProposal', ByteRepresentation.Ascii)">ascii</button>
          </div>
        </div>
        <div class="modify group">
          <div class="btn-group">
            <button class="btn secondary" :disabled="!editable" @click="editMode = true">edit</button>
          </div>
        </div>
      </div>
    </header>
    <main>
      <MemoryEditor v-if="editMode" :group @cancel="editMode = false" @done="editMode = false" />
      <div v-else-if="computedView == ByteRepresentation.Decimal" class="bytes">
        {{ bytes.join(' ') }}
      </div>
      <div v-else-if="computedView == ByteRepresentation.Binary" class="bytes">
        {{ bin(bytes, ' ') }}
      </div>
      <div v-else-if="computedView == ByteRepresentation.Ascii" class="bytes">
        <span v-for="b in bytes" class="ascii" :class="{ 'non-printable': !isAsciiPrintable(b) }"
          :title="!isAsciiPrintable(b) ? `0x${hex(b)}` : ''">
          {{ ascii(b) }}
        </span>
      </div>
      <div v-else class="bytes">
        {{ hex(bytes, ' ') }}
      </div>
    </main>
    <footer>
      <div v-if="key && !group.keyCan(key, 'read')">
        <p class="info">
          * Group {{ MifareClassicBlockGroupType[group.type] }} is unreadable
          due to restrictions of the key ({{ keyTypeName(key.type) }}) used in sector authentication.
          Therefore, the content is blanked with all zeros.
        </p>
      </div>
    </footer>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.MemoryViewer {
  .toolbar {
    display: flex;
    justify-content: start;

    &>.group:not(:first-child) {
      margin-left: 1rem;
    }
  }

  .bytes {
    .ascii.non-printable {
      opacity: .3;
    }
  }

  main,
  footer {
    margin-top: .5rem;
  }

  .info {
    color: color.adjust($color-fg, $lightness: -30%);
    font-size: .8em;
  }
}
</style>
