<script setup lang="ts">
import BlockFocus from "@/components/Memory/components/Block/BlockFocus";
import BlockGroup from "@/components/Memory/components/BlockGroup/BlockGroup.vue";
import {
  MifareClassicBlock,
  MifareClassicBlockType
} from "@/models/MifareClassic";
import { computed } from "vue";

const props = defineProps<{
  block: MifareClassicBlock;
  focus?: BlockFocus;
}>();

const classes = computed(() => ({
  focused: props.focus?.block.hasSameAddressAs(props.block),
  empty: !props.block.loaded,
  undefined: props.block.type == MifareClassicBlockType.Undefined,
  trailer: props.block.type == MifareClassicBlockType.SectorTrailer,
  manufacturer: props.block.type == MifareClassicBlockType.Manufacturer,
  data: props.block.type == MifareClassicBlockType.Data,
  value: props.block.type == MifareClassicBlockType.Value,
}));
</script>

<template>
  <div class="Block" :class="classes">
    <BlockGroup :group="group" v-for="group in block.blockGroups" :focus="focus?.groupFocus" />
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.Block {
  display: flex;
  color: color.adjust($color-bg, $lightness: +40%);
}

.Block.undefined {
  color: transparent;
}

.Block:not(.undefined) {
  $highlight-color: $color-1;
  $lightness: -30%;

  .BlockGroup:hover,
  .BlockGroup.focused {
    .Byte {
      border-bottom-color: color.adjust($highlight-color, $lightness: $lightness) !important;

      &:not(:last-child) {
        border-right-color: color.adjust($highlight-color, $lightness: $lightness);
      }
    }
  }
}

.Block.trailer {
  .key-a {
    color: color.adjust($color-3, $hue: -35deg);
  }

  .access-bits {
    color: color.adjust($color-3, $hue: 0deg);
  }

  .user-byte {
    color: $color-4;
  }

  .key-b {
    color: color.adjust($color-3, $hue: +35deg);
  }
}

.Block.value {
  .value {
    color: $color-1;
  }

  .value-inverted {
    color: color.adjust($color-1, $blackness: 30%);
  }

  .addr {
    color: $color-2;
  }

  .addr-inverted {
    color: color.adjust($color-2, $blackness: 30%);
  }
}

.Block.data {
  color: $color-4;
}

.Block.manufacturer {
  .uid {
    color: $color-5;
  }

  .bcc {
    color: color.adjust($color-5, $hue: -40deg);
  }

  .sak {
    color: color.adjust($color-5, $hue: -70deg);
  }

  .atqa {
    color: color.adjust($color-5, $hue: -100deg);
  }

  .manufacturer {
    color: color.adjust($color-5, $hue: -130deg);
  }
}
</style>
