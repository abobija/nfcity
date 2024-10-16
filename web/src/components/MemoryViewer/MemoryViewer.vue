<script setup lang="ts">
import MemoryBlockEditor, { isBlockEditable } from "@/components/MemoryBlockEditor/MemoryBlockEditor.vue";
import { MifareClassicBlock, MifareClassicBlockGroupType, MifareClassicSectorTrailerBlock } from "@/models/MifareClassic";
import { keyTypeName } from "@/models/Picc";
import { ascii, bin, hex, isAsciiPrintable } from "@/utils/helpers";
import ByteRepresentation, { byteRepresentationShortName } from "@Memory/ByteRepresentation";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
}>();

const representations = [
  ByteRepresentation.Hexadecimal,
  ByteRepresentation.Decimal,
  ByteRepresentation.Binary,
  ByteRepresentation.Ascii,
];

const representation = ref(ByteRepresentation.Hexadecimal);
const showIndexes = ref(false);
const key = computed(() => props.block.sector.key);
const editable = computed(() => isBlockEditable(props.block));
const editMode = ref(false);
const keyRestrictions = computed<string[]>(() => {
  const list: string[] = [];

  const unreadableGroups = props.block.blockGroups
    .filter((group) => key.value && !group.keyCan(key.value, 'read'));

  if (unreadableGroups.length > 0 && key.value) {
    list.push(`
        ${unreadableGroups.map(group => MifareClassicBlockGroupType[group.type]).join(' & ')}
        ${unreadableGroups.length > 1 ? 'are' : 'is'} unreadable and blanked with zeros
        due to restrictions of the key ${keyTypeName(key.value.type)} used in sector authentication.
      `);
  }

  if (props.block instanceof MifareClassicSectorTrailerBlock
    && key.value && !props.block.keyCanWriteToAnyGroup(key.value)) {
    list.push(`
      The key ${keyTypeName(key.value.type)} used for sector authentication
      cannot write to any group in this sector trailer.
      `);
  }

  return list;
});

watch(() => props.block, () => editMode.value = false);
</script>

<template>
  <section class="MemoryViewer" :class="{
    hex: representation === ByteRepresentation.Hexadecimal,
    dec: representation === ByteRepresentation.Decimal,
    bin: representation === ByteRepresentation.Binary,
    ascii: representation === ByteRepresentation.Ascii,
  }">
    <header>
      <div v-if="!editMode" class="toolbar">
        <div class="view group">
          <div class="btn-group">
            <button class="btn info" v-for="r in representations" :class="{ activated: r === representation }"
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
            <button :disabled="!editable" class="btn primary" @click="editMode = true">edit</button>
          </div>
        </div>
      </div>
    </header>
    <main>
      <div class="bytes" v-if="!editMode">
        <div v-for="group in block.blockGroups" class="group" :class="{
          unreadable: key && !group.keyCan(key, 'read'),
        }">
          <span v-for="(byte, index) in group.data()" class="byte" :class="{
            indexed: showIndexes,
            unprintable: representation === ByteRepresentation.Ascii && !isAsciiPrintable(byte),
          }" :data-index="String(index).padStart(2, '0')">
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
      </div>
      <MemoryBlockEditor v-if="editMode && editable" :block @cancel="editMode = false" @done="editMode = false" />
    </main>
    <footer>
      <p v-for="restriction in keyRestrictions" class="restriction">
        * {{ restriction }}
      </p>
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

    .group.view {
      flex-shrink: 0;
    }
  }

  .bytes {
    .group {
      display: inline;
    }

    .byte {
      display: inline-block;
      color: $color-1;

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

    .group,
    .byte {
      &:not(:last-child) {
        margin-right: .4rem;
      }
    }

    .unreadable .byte {
      text-decoration: line-through;
      color: color.adjust($color-fg, $lightness: -40%);
    }
  }

  &.ascii {

    .group,
    .byte {
      &:not(:last-child) {
        margin-right: 0;
      }
    }

    .byte:not(.indexed) {
      width: 1ch;
    }
  }

  main,
  footer {
    margin-top: .5rem;
  }

  footer .restriction {
    color: color.adjust($color-fg, $lightness: -40%);
    font-size: .7em;
    margin-top: .2rem;
  }
}
</style>
