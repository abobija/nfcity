<script setup lang="ts">
import {
  AccessBitsCombo,
  AccessBitsPoolIndex,
  dataBlockCombos,
  sectorTrailerCombos
} from '@/models/MifareClassic';
import { bin } from '@/utils/helpers';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  poolIndex: AccessBitsPoolIndex,
}>();

const combo = defineModel<AccessBitsCombo>({ required: true });
const combos = computed(() => props.poolIndex === 3 ? sectorTrailerCombos : dataBlockCombos);
const comboIndex = ref(combos.value.indexOf(combo.value));
const maxComboIndex = computed(() => combos.value.length - 1);
const _combo = computed(() => combos.value[comboIndex.value]);

watch(comboIndex, (newIndex) => combo.value = combos.value[newIndex]);
</script>

<template>
  <section class="AccessBitsComboSwitcher">
    <div class="btn-group">
      <button type="button" class="btn info dec" :disabled="comboIndex <= 0" @click="comboIndex--">&laquo;</button>
      <button type="button" class="btn txt info combo" disabled>{{ bin(_combo).slice(-3) }}</button>
      <button type="button" class="btn info inc" :disabled="comboIndex >= maxComboIndex"
        @click="comboIndex++">&raquo;</button>
    </div>
  </section>
</template>

<style lang="scss">
.AccessBitsComboSwitcher {
  button.combo {
    font-weight: 600;
  }
}
</style>
