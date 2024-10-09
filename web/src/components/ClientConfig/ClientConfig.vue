<script setup lang="ts">
import '@/components/ClientConfig/ClientConfig.scss';
import { ClientStorage, validateClientStorage, ValidClientStorage } from '@/storage/ClientStorage';
import { clone } from '@/utils/helpers';
import { logger } from '@/utils/Logger';
import { onMounted, ref, useTemplateRef } from 'vue';

const props = defineProps<{
  clientStorage: ClientStorage;
  cancelable?: boolean;
}>();

const emits = defineEmits<{
  (e: 'save', clientStorageProposal: ValidClientStorage): void;
  (e: 'cancel'): void;
}>();

const localClientStorage = ref(clone(props.clientStorage));
const brokerUrlRef = useTemplateRef('broker-url');
const rootTopicRef = useTemplateRef('root-topic');

onMounted(() => {
  rootTopicRef.value?.focus();
});

function onSubmit() {
  const errors = validateClientStorage(localClientStorage.value);

  if (errors.length > 0) {
    errors.forEach(e => logger.debug('validation', e.error));

    if (errors.some(e => e.field == 'brokerUrl')) {
      brokerUrlRef.value?.focus();
    } else if (errors.some(e => e.field == 'rootTopic')) {
      rootTopicRef.value?.focus();
    }

    return;
  }

  emits('save', localClientStorage.value as ValidClientStorage);
}
</script>

<template>
  <div class="client-config component">
    <form @submit.prevent="onSubmit">
      <div class="form-group">
        <input type="text" placeholder="Broker" v-model.trim="localClientStorage.brokerUrl" ref="broker-url"
          spellcheck="false" />
      </div>
      <div class="form-group">
        <input type="text" placeholder="Root Topic" v-model.trim="localClientStorage.rootTopic" ref="root-topic"
          spellcheck="false" />
      </div>
      <div class="form-group">
        <button class="btn primary" type="submit">Save</button>
        <button v-if="props.cancelable" class="btn secondary" @click="emits('cancel')" type="button">Cancel</button>
      </div>
    </form>
  </div>
</template>
