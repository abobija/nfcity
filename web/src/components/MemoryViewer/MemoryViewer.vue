<script setup lang="ts">
import MemoryEditor from "@/components/MemoryEditor/MemoryEditor.vue";
import { MifareClassicBlock, MifareClassicBlockGroupType, MifareClassicDataBlock } from "@/models/MifareClassic";
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
const editable = computed(() => {
  return props.block instanceof MifareClassicDataBlock
    && key.value !== undefined
    && props.block.keyCan(key.value, 'write');
});
const editMode = ref(false);
const infos = computed<string[]>(() => {
  const list: string[] = [];

  const unreadableGroups = props.block.blockGroups
    .filter((group) => key.value && !group.keyCan(key.value, 'read'));

  if (unreadableGroups.length > 0 && key.value) {
    list.push(`
        Group${unreadableGroups.length > 1 ? 's' : ''}
        ${unreadableGroups.map(group => MifareClassicBlockGroupType[group.type]).join(' & ')}
        ${unreadableGroups.length > 1 ? 'are' : 'is'} unreadable
        due to restrictions of the key ${keyTypeName(key.value.type)} used in sector authentication.
        Therefore, group${unreadableGroups.length > 1 ? 's' : ''} ${unreadableGroups.length > 1 ? 'are' : 'is'}
        blanked with zeros.
      `);
  }

  return list;
});

watch(() => props.block, () => editMode.value = false);
</script>

<template>
  <section class="MemoryViewer">
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
      <MemoryEditor v-if="editMode" :block @cancel="editMode = false" @done="editMode = false" />
    </main>
    <footer>
      <p v-for="info in infos" class="info">
        * {{ info }}
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

  main,
  footer {
    margin-top: .5rem;
  }

  footer .info {
    color: color.adjust($color-fg, $lightness: -40%);
    font-size: .7em;
    margin-top: .2rem;
  }
}
</style>
