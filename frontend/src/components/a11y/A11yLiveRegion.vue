<script setup lang="ts">
import { computed } from 'vue'
import { useAnnouncerStore } from '../../stores/announcer'

const announcer = useAnnouncerStore()
const isAssertive = computed(() => announcer.politeness === 'assertive')
</script>

<template>
  <div class="sr-only" aria-hidden="false">
    <div v-if="!isAssertive" :key="announcer.seq" role="status" aria-live="polite" aria-atomic="true">
      {{ announcer.text }}
    </div>
    <div v-else :key="`assertive-${announcer.seq}`" role="alert" aria-live="assertive" aria-atomic="true">
      {{ announcer.text }}
    </div>
  </div>
</template>
