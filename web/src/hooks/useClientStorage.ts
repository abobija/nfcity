import { clientStorageKey } from "@/iocKeys";
import { NonValidatedClientStorage } from "@/storage/ClientStorage";
import { inject, Ref } from "vue";

export function useClientStorage() {
  return inject(clientStorageKey) as Ref<NonValidatedClientStorage>;
};
