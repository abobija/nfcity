<script setup lang="ts">
import { hex } from '../../helpers';
import Picc, { PiccType } from '../../models/Picc';
import './PiccDashboard.scss';
import PiccMemoryLayout from './PiccMemoryLayout.vue';

defineProps<{
  picc: Picc;
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
        <!-- <li class="meta">
          <span class="name">State</span>
          <span class="value">{{ PiccState[picc.state] }}</span>
        </li> -->
      </ul>
    </div>

    <PiccMemoryLayout />
  </div>
</template>
