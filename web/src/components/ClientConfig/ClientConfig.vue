<script setup lang="ts">
import { ClientValidator } from "@/communication/Client";
import HoverableInputPlaceholder from "@/components/HoverableInputPlaceholder/HoverableInputPlaceholder.vue";
import { ClientStorage, validateClientStorage, ValidClientStorage } from "@/composables/useClientStorage";
import vFocus from "@/directives/vFocus";
import { cloneObject } from "@/utils/helpers";
import { logd } from "@/utils/Logger";
import { ref, useTemplateRef } from "vue";

const props = defineProps<{
  clientStorage: ClientStorage;
  cancelable?: boolean;
}>();

const emits = defineEmits<{
  (e: 'save', clientStorageProposal: ValidClientStorage): void;
  (e: 'cancel'): void;
}>();

const localClientStorage = ref(cloneObject(props.clientStorage));
const brokerUrlRef = useTemplateRef('broker-url');
const rootTopicRef = useTemplateRef('root-topic');

function onSubmit() {
  const errors = validateClientStorage(localClientStorage.value);

  if (errors.length === 0) {
    emits('save', localClientStorage.value as ValidClientStorage);
    return;
  }

  errors.forEach(e => logd('validation', e.error));

  let errorInput: HTMLInputElement | null = null;

  if (errors.some(e => e.field == 'brokerUrl')) {
    errorInput = brokerUrlRef.value;
  } else if (errors.some(e => e.field == 'rootTopic')) {
    errorInput = rootTopicRef.value;
  }

  errorInput?.focus();
}
</script>

<template>
  <section class="ClientConfig">
    <form @submit.prevent="onSubmit">
      <div class="form-group">
        <HoverableInputPlaceholder>
          <input type="text" placeholder="Broker" v-model.trim="localClientStorage.brokerUrl" ref="broker-url"
            spellcheck="false" required name="brokerUrl" />
        </HoverableInputPlaceholder>
      </div>
      <div class="form-group">
        <HoverableInputPlaceholder>
          <input v-focus type="text" placeholder="Root Topic" v-model.trim="localClientStorage.rootTopic"
            ref="root-topic" spellcheck="false" :maxlength="ClientValidator.RootTopicLength" required
            name="rootTopic" />
        </HoverableInputPlaceholder>
      </div>
      <div class="form-group">
        <button v-if="props.cancelable" class="btn secondary" @click="emits('cancel')" type="button">Cancel</button>
        <button class="btn primary" type="submit">Save</button>
      </div>
    </form>
  </section>
</template>

<style lang="scss">
.ClientConfig {
  form {
    display: flex;
    flex-direction: column;
    align-items: center;

    input[type="text"] {
      font-size: .8rem;
      width: 16rem;
    }

    button[type="submit"] {
      margin-top: 1rem;
    }
  }

  .form-group:not(:last-child) {
    margin-bottom: .7rem;
  }
}
</style>
