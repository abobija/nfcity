import Client from "@/comm/Client";
import { Logger } from "@/utils/Logger";
import { Ref, ref, shallowReadonly, watch } from "vue";

const logger = Logger.fromName('ClientInjection');

export default interface ClientInjection<T = Client | undefined> {
  client: Readonly<Ref<T>>;
  updateClient: (newClient: T) => void;
}

export function newClientInjection(): ClientInjection {
  const clientRef = ref<Client>();

  watch(clientRef, (newClient, oldClient) => {
    logger.debug('client changed', 'from', oldClient, 'to', newClient);
  });

  return {
    client: shallowReadonly(clientRef),
    updateClient: (newClient?: Client) => clientRef.value = newClient,
  };
}
