<script setup lang="ts">
import MemoryBlockEditor, { isBlockEditable } from "@/components/MemoryBlockEditor/MemoryBlockEditor.vue";
import { MifareClassicBlock, MifareClassicBlockGroupType, MifareClassicSectorTrailerBlock, MifareClassicValueBlock } from "@/models/MifareClassic";
import { keyTypeName } from "@/models/Picc";
import { ascii, assert, bin, hex, isAsciiPrintable } from "@/utils/helpers";
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
const showRestrictions = ref(true);
const restrictions = computed<string[]>(() => {
  const list: string[] = [];

  assert(key.value !== undefined, 'key is undefined');

  const unreadableGroups = props.block.groups
    .filter((group) => !group.keyCan(key.value!, 'read'));

  if (unreadableGroups.length > 0) {
    list.push(`
        Cannot read ${unreadableGroups.map(group => MifareClassicBlockGroupType[group.type]).join(' & ')}
        group${unreadableGroups.length > 1 ? 's' : ''},
        so ${unreadableGroups.length > 1 ? 'they are' : 'it is'} blanked with zeros.
      `);
  }

  const unwritableGroups = props.block.groups
    .filter((group) => !group.keyCan(key.value!, 'write'));

  if (unwritableGroups.length > 0) {
    if (props.block instanceof MifareClassicSectorTrailerBlock) {
      const allGroupsAreUnwritable = unwritableGroups.length === props.block.groups.length;
      const groups = unwritableGroups.map(group => MifareClassicBlockGroupType[group.type]).join(' & ');

      list.push(`
          Cannot write to
          ${allGroupsAreUnwritable ? 'any (' : ''}${groups}${allGroupsAreUnwritable ? ')' : ''}
          group${!allGroupsAreUnwritable && unwritableGroups.length > 1 ? 's' : ''}.
        `);
    }
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
    indexed: showIndexes,
  }">
    <header v-if="!editMode">
      <div class="toolbar">
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
        <div v-for="group in block.groups" class="group" :class="{
          unreadable: key && !group.keyCan(key, 'read'),
        }">
          <span v-for="(byte, index) in group.data()" class="byte" :class="{
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
      <div class="restrictions" v-if="key && showRestrictions && restrictions.length > 0">
        <p class="intro">
          Restrictions of key {{ keyTypeName(key.type) }}, used in sector authentication:
        </p>

        <ul class="list">
          <li v-for="restriction in restrictions" class="restriction">{{ restriction }}</li>
        </ul>
      </div>
      <div v-if="block instanceof MifareClassicValueBlock">
        Edit of value blocks is not supported yet.
      </div>
    </footer>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.MemoryViewer {
  .toolbar {
    button {
      padding: .2rem .3rem;
      font-size: .5rem;
    }
  }

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
      color: color.adjust($color-3, $hue: -20deg);

      &.unprintable {
        color: color.adjust($color-fg, $lightness: -50%);
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
  }

  &:not(.indexed).ascii {
    .byte {
      width: 1ch;
    }
  }

  &.indexed {
    .group {
      display: block;
    }

    .byte {
      display: block;

      &::before {
        content: '[' attr(data-index) '] ';
        color: color.adjust($color-fg, $lightness: -50%);
      }
    }
  }

  &>*:not(:last-child) {
    margin-bottom: 1rem;
  }

  footer .restrictions {
    color: color.adjust($color-fg, $lightness: -40%);
    font-size: .7em;
    margin-top: .2rem;

    .intro {
      font-weight: 600;
    }

    .list {
      margin-top: .3rem;
      list-style: square;
      margin-left: .8rem;

      .restriction:not(:last-child) {
        margin-bottom: .2rem;
      }
    }
  }
}
</style>
