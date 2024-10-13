<script setup lang="ts">
import { keySize, MifareClassicSector } from "@/models/MifareClassic";
import { keyA, keyB, KeyType, PiccKey } from "@/models/Picc";
import { computed, ref } from "vue";
import BytesInput from "../../BytesInput/BytesInput.vue";

const props = defineProps<{
  sector: MifareClassicSector;
  piccKey: PiccKey;
}>();

const emit = defineEmits<{
  (e: 'unlock', piccKeyProposal: PiccKey): void;
  (e: 'cancel'): void;
}>();

const keyType = ref<KeyType>(props.piccKey.type);
const keyValue = ref(Array.from(props.piccKey.value));
const unlockable = computed(() => keyValue.value.length === keySize);

function onSubmit() {
  const key: PiccKey = {
    type: keyType.value == keyA ? keyA : keyB,
    value: keyValue.value,
  };

  emit('unlock', key);
}
</script>

<template>
  <div class="memory-sector-overlay unlock component">
    <form class="form" @submit.prevent="onSubmit">
      <div class="row key">
        <label for="key-a" title="Use key A">
          <input type="radio" name="key" :value="keyA" id="key-a" v-model="keyType" /> A
        </label>
        <label for="key-b" title="Use key B">
          <input type="radio" name="key" :value="keyB" id="key-b" v-model="keyType" /> B
        </label>
        <BytesInput v-model="keyValue" :maxlength="keySize" autofocus />
        <button class="primary" type="submit" :disabled="!unlockable">Unlock</button>
        <button class="secondary" @click.prevent="$emit('cancel')" type="button">Cancel</button>
      </div>
    </form>
  </div>
</template>
