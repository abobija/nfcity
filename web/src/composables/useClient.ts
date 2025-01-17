import Client from "@/communication/Client";
import { keys } from "@/keys";
import makeLogger from "@/utils/Logger";
import { inject, ref, Ref, shallowReadonly, watch } from "vue";

const logger = makeLogger('useClient');

export interface ClientInjection<T = Client | undefined> {
  client: Readonly<Ref<T>>;
  updateClient: (newClient: T) => void;
}

export function newClientInjection(): ClientInjection {
  const clientRef = ref<Client>();

  watch(clientRef, (newClient, oldClient) => {
    logger.debug('client changed', 'from', oldClient, 'to', newClient);
  }, { deep: false });

  return {
    client: shallowReadonly(clientRef),
    updateClient: (newClient?: Client) => clientRef.value = newClient,
  };
}

export function useClientMaybe() {
  return useIt<Client | undefined>();
}

export default function useClient() {
  return useIt<Client>();
}

function useIt<T = Client | undefined>() {
  return inject(keys.client) as ClientInjection<T>;
}
