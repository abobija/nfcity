<script setup lang="ts">
import { keySize, MifareClassicSector } from "@/models/MifareClassic";
import { keyA, keyB, KeyType, PiccKey } from "@/models/Picc";
import BytesInput from "@Memory/components/BytesInput/BytesInput.vue";
import { computed, ref } from "vue";

defineProps<{
  sector: MifareClassicSector;
}>();

defineEmits<{
  (e: 'cancel'): void;
}>();

const key = defineModel<PiccKey>({ required: true });
const keyType = ref<KeyType>(key.value.type);
const keyValue = ref(Array.from(key.value.value));
const unlockable = computed(() => keyValue.value.length === keySize);

function onSubmit() {
  key.value = {
    type: keyType.value == keyA ? keyA : keyB,
    value: keyValue.value,
  };
}
</script>

<template>
  <div class="AuthenticationFormSectorOverlay">
    <form class="form" @submit.prevent="onSubmit">
      <div class="row key">
        <label :for="`keya-s${sector.offset}`" title="Use key A">
          <input type="radio" name="keya" :id="`keya-s${sector.offset}`" :value="keyA" v-model="keyType" /> A
        </label>
        <label :for="`keyb-s${sector.offset}`" title="Use key B">
          <input type="radio" name="keyb" :id="`keyb-s${sector.offset}`" :value="keyB" v-model="keyType" /> B
        </label>
        <BytesInput v-model="keyValue" :maxlength="keySize" autofocus />
        <button class="primary" type="submit" :disabled="!unlockable">Unlock</button>
        <button class="secondary" @click.prevent="$emit('cancel')" type="button">Cancel</button>
      </div>
    </form>
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.AuthenticationFormSectorOverlay {
  form {

    label,
    input,
    button,
    textarea {
      font-size: 0.7rem;
    }

    textarea,
    button {
      padding: 0.4rem 0.5rem;
    }

    textarea {
      width: 6rem;
    }

    button {
      margin-left: 0.5rem;
    }
  }
}
</style>
