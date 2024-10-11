import Client from "@/comm/Client";
import ClientInjection from "@/ioc/ClientInjection";
import { clientKey } from "@/ioc/keys";
import { inject } from "vue";

export function useClientMaybe() {
  return useIt<Client | undefined>();
}

export default function useClient() {
  return useIt<Client>();
}

function useIt<T = Client | undefined>() {
  return inject(clientKey) as ClientInjection<T>;
}
