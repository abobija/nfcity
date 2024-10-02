<script setup lang="ts">
import '@/components/Dashboard/Dashboard.scss';
import Memory from '@/components/Memory/Memory.vue';
import { hex } from '@/helpers';
import MifareClassic from '@/models/MifareClassic';
import { PiccType } from '@/models/Picc';
import InfoPanel from '../InfoPanel/InfoPanel.vue';

defineProps<{
  picc: MifareClassic;
}>();
</script>

<template>
  <div class="dashboard">
    <div class="header">
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
    </div>

    <div class="main">
      <div class="section">
        <Memory :picc="picc" />
      </div>
      <div class="section">
        <InfoPanel />
      </div>
    </div>
  </div>
</template>
