<script setup lang="ts">
import '@/components/MemorySector/MemorySectorUnlockOverlay.scss';
import { hex, hex2arr, isHex } from '@/helpers';
import { logger } from '@/Logger';
import { defaultKey, MifareClassicSector } from '@/models/MifareClassic';
import { PiccKey, PiccKeyType } from '@/models/Picc';
import { onMounted, ref, useTemplateRef } from 'vue';

defineProps<{
  sector: MifareClassicSector;
}>();

const emit = defineEmits<{
  (e: 'unlock', piccKey: PiccKey): void;
}>();

const keyType = ref<'A' | 'B'>('A');
const keyInput = useTemplateRef('key-input');
const key = ref<string>(hex(defaultKey.value, ''));

function onSubmit() {
  if (key.value.length != 12) {
    logger.error('Key must be 6 bytes (12 characters)');
    return;
  }

  if (!isHex(key.value)) {
    logger.error('Key must be a valid hex string');
    return;
  }

  const piccKey: PiccKey = {
    type: keyType.value == 'A' ? PiccKeyType.A : PiccKeyType.B,
    value: hex2arr(key.value),
  };

  emit('unlock', piccKey);
}

onMounted(() => {
  keyInput.value?.focus();
});
</script>

<template>
  <div class="memory-sector-overlay unlock component">
    <form class="form" @submit.prevent="onSubmit">
      <div class="row key">
        <label for="key-a" title="Key type A">
          <input type="radio" name="key" value="A" id="key-a" v-model="keyType" />
          A
        </label>
        <label for="key-b" title="Key type B">
          <input type="radio" name="key" value="B" id="key-b" v-model="keyType" />
          B
        </label>
        <input type="text" placeholder="Key (hex)" v-model.trim="key" ref="key-input" title="Key (hex)"
          spellcheck="false" />
        <button class="primary" type="submit">Unlock</button>
      </div>
    </form>
  </div>
</template>
