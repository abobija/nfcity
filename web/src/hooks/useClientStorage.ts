import { clientStorageKey } from "@/iocKeys";
import { ClientStorage } from "@/storage/ClientStorage";
import { inject, Ref } from "vue";

export function useClientStorage() {
  return inject(clientStorageKey) as Ref<ClientStorage>;
};
