import Client from "@/comm/Client";
import { clientKey } from "@/iocKeys";
import { inject, Ref } from "vue";

export function useClientMaybe() {
  return useIt<Client | undefined>();
}

export function useClient() {
  return useIt<Client>();
}

function useIt<T = Client | undefined>() {
  const client = inject(clientKey) as Ref<T>;

  return {
    client,
    updateClient: (newClient: T) => { client.value = newClient; }
  };
}
