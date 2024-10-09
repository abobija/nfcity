<script setup lang="ts">
import { MifareClassicSector } from '@/models/MifareClassic';
import { PiccKey, PiccKeyType } from '@/models/Picc';
import { hex, hex2arr, isHex } from '@/utils/helpers';
import { logger } from '@/utils/Logger';
import { onMounted, ref, useTemplateRef } from 'vue';

const props = defineProps<{
  sector: MifareClassicSector;
  piccKey: PiccKey;
}>();

const emit = defineEmits<{
  (e: 'unlock', piccKeyProposal: PiccKey): void;
}>();

const keyType = ref<'A' | 'B'>(props.piccKey.type == PiccKeyType.A ? 'A' : 'B');
const keyInput = useTemplateRef('key-input');
const keyValue = ref<string>(hex(props.piccKey.value, ''));

function onSubmit() {
  if (keyValue.value.length != 12) {
    logger.error('Key must be 6 bytes (12 characters)');
    return;
  }

  if (!isHex(keyValue.value)) {
    logger.error('Key must be a valid hex string');
    return;
  }

  const piccKey: PiccKey = {
    type: keyType.value == 'A' ? PiccKeyType.A : PiccKeyType.B,
    value: hex2arr(keyValue.value),
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
        <label for="key-a" title="Use key A">
          <input type="radio" name="key" value="A" id="key-a" v-model="keyType" />
          A
        </label>
        <label for="key-b" title="Use key B">
          <input type="radio" name="key" value="B" id="key-b" v-model="keyType" />
          B
        </label>
        <input type="text" placeholder="Key (hex)" v-model.trim="keyValue" ref="key-input" title="Key (hex)"
          spellcheck="false" />
        <button class="primary" type="submit">Unlock</button>
      </div>
    </form>
  </div>
</template>
