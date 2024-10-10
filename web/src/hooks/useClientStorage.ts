import ClientStorageInjection from "@/ioc/ClientStorageInjection";
import { clientStorageKey } from "@/ioc/keys";
import { inject } from "vue";

export function useClientStorage() {
  return inject(clientStorageKey) as ClientStorageInjection;
};
