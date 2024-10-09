<script setup lang="ts">
import { ClientValidator } from '@/comm/Client';
import '@/components/ClientConfig/ClientConfig.scss';
import { NonValidatedClientStorage, ValidatedClientStorage } from '@/storage/ClientStorage';
import { clone } from '@/utils/helpers';
import { logger } from '@/utils/Logger';
import { onMounted, ref, useTemplateRef } from 'vue';

const props = defineProps<{
  clientStorage: NonValidatedClientStorage;
}>();

const emits = defineEmits<{
  (e: 'save', clientStorage: ValidatedClientStorage): void;
}>();

const localClientStorage = ref(clone(props.clientStorage));
const brokerUrlRef = useTemplateRef('broker-url');
const rootTopicRef = useTemplateRef('root-topic');

onMounted(() => {
  rootTopicRef.value?.focus();
});

function validate() {
  try {
    ClientValidator.validateBrokerUrl(localClientStorage.value.brokerUrl);
  } catch {
    brokerUrlRef.value?.focus();
    return false;
  }

  try {
    ClientValidator.validateRootTopic(localClientStorage.value.rootTopic);
  } catch {
    rootTopicRef.value?.focus();
    return false;
  }

  return true;
}

function onSubmit() {
  if (!validate()) {
    logger.warning('Validation failed');
    return;
  }

  emits('save', localClientStorage.value as ValidatedClientStorage);
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
      </div>
    </form>
  </div>
</template>
