<script setup lang="ts">
import MemoryEditor from "@/components/MemoryEditor/MemoryEditor.vue";
import { MifareClassicBlockGroup, MifareClassicBlockGroupType } from "@/models/MifareClassic";
import { keyTypeName } from "@/models/Picc";
import { ascii, bin, hex, isAsciiPrintable } from "@/utils/helpers";
import ByteRepresentation, { byteRepresentationShortName } from "@Memory/ByteRepresentation";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  group: MifareClassicBlockGroup;
}>();

const representations = [
  ByteRepresentation.Hexadecimal,
  ByteRepresentation.Decimal,
  ByteRepresentation.Binary,
  ByteRepresentation.Ascii,
];

const representation = ref(ByteRepresentation.Hexadecimal);
const showIndexes = ref(false);
const block = computed(() => props.group.block);
const key = computed(() => block.value.sector.key);
const bytes = computed(() => props.group.data());
const editable = computed(() => {
  return props.group.type === MifareClassicBlockGroupType.Data
    && key.value !== undefined
    && props.group.keyCan(key.value, 'write');
});
const editMode = ref(false);

watch(() => props.group, () => editMode.value = false);
</script>

<template>
  <section class="MemoryViewer" :class="{ unreadable: key && !group.keyCan(key, 'read') }">
    <header>
      <div v-if="!editMode" class="toolbar">
        <div class="view group">
          <div class="btn-group">
            <button class="btn primary" v-for="r in representations" :class="{ activated: r === representation }"
              @click="representation = r">{{ byteRepresentationShortName(r) }}</button>
          </div>
        </div>
        <div class="display group">
          <div class="btn-group">
            <button class="btn secondary" :class="{ activated: showIndexes }"
              @click="showIndexes = !showIndexes">[i]</button>
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
      <div class="bytes" v-if="!editMode">
        <span v-for="(byte, index) in bytes" class="byte" :class="{
          indexed: showIndexes,
          unprintable: representation === ByteRepresentation.Ascii && !isAsciiPrintable(byte),
        }" :data-index="String(group.offset + index).padStart(2, '0')">
          {{
            representation === ByteRepresentation.Decimal
              ? byte
              : representation === ByteRepresentation.Binary
                ? bin(byte)
                : representation === ByteRepresentation.Ascii
                  ? ascii(byte)
                  : hex(byte)
          }}
        </span>
      </div>
      <MemoryEditor v-if="editMode" :group @cancel="editMode = false" @done="editMode = false" />
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
    .byte {
      display: inline-block;

      &:not(:last-child) {
        margin-right: .5rem;
      }

      &.unprintable {
        color: color.adjust($color-fg, $lightness: -50%);
      }

      &.indexed {
        display: block;

        &::before {
          content: '[' attr(data-index) '] ';
          color: color.adjust($color-fg, $lightness: -50%);
        }
      }
    }
  }

  &.unreadable .bytes {
    color: color.adjust($color-fg, $lightness: -50%);
  }

  main,
  footer {
    margin-top: .5rem;
  }

  .info {
    color: color.adjust($color-fg, $lightness: -20%);
    font-size: .8em;
  }
}
</style>
