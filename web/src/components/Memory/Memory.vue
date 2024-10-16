<script setup lang="ts">
import onClientMessage from "@/communication/composables/onClientMessage";
import { isPiccBlockDeviceMessage } from "@/communication/messages/device/PiccBlockDeviceMessage";
import { isPiccSectorDeviceMessage } from "@/communication/messages/device/PiccSectorDeviceMessage";
import { MifareClassicMemory } from "@/models/MifareClassic";
import MemoryFocus from "@Memory/MemoryFocus";
import Sector from "@Memory/components/Sector/Sector.vue";
import { computed } from "vue";

const props = defineProps<{
  memory: MifareClassicMemory;
  focus?: MemoryFocus;
}>();

const classes = computed(() => ({
  focused: focus !== undefined,
}));

onClientMessage(e => {
  if (isPiccBlockDeviceMessage(e.message)) {
    props.memory.blockAtAddress(e.message.address)?.updateWith({
      address: e.message.address,
      data: Array.from(e.message.data),
    });
  } else if (isPiccSectorDeviceMessage(e.message)) {
    props.memory.sectorAtOffset(e.message.offset)?.updateWith({
      blocks: e.message.blocks.map(b => ({
        address: b.address,
        data: Array.from(b.data),
      })),
    });
  }
});
</script>

<template>
  <section class="Memory" :class="classes">
    <Sector v-for="(sector, sectorOffset) in memory.sectors" :key="sectorOffset" :sector :focus="focus?.sectorFocus" />
  </section>
</template>

<style lang="scss">
.Memory {
  display: flex;
  flex-direction: column-reverse;
}
</style>
