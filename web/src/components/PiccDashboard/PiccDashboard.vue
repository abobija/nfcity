<script setup lang="ts">
import '@/components/PiccDashboard/PiccDashboard.scss';
import PiccMemoryLayout from '@/components/PiccDashboard/PiccMemoryLayout.vue';
import { hex } from '@/helpers';
import MifareClassic from '@/models/MifareClassic';
import { PiccType } from '@/models/Picc';

defineProps<{
  picc: MifareClassic;
}>();
</script>

<template>
  <div class="picc-dashboard">
    <div class="picc">
      <h1 class="type">{{ PiccType[picc.type] }}</h1>
      <ul class="metas">
        <li class="meta">
          <span class="name">UID</span>
          <span class="value">{{ hex(picc.uid) }}</span>
        </li>
        <li class="meta">
          <span class="name">ATQA</span>
          <span class="value">{{ hex(picc.atqa) }}</span>
        </li>
        <li class="meta">
          <span class="name">SAK</span>
          <span class="value">{{ hex(picc.sak) }}</span>
        </li>
      </ul>
    </div>

    <PiccMemoryLayout :picc="picc" />
  </div>
</template>
