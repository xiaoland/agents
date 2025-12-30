<script setup lang="ts">
import { compNameProps, compNameEmits } from "./compName";

const props = defineProps(compNameProps);
const emit = defineEmits(compNameEmits);
// const model = defineModel({ type: String }); // For v-model

// --- data ---

// --- computed ---

// --- methods ---

// --- watchers ---

// --- lifecycle hooks ---

// --- exposes ---
</script>

<template>
  <div class="comp-name">
    <!-- Component template -->
  </div>
</template>

<style lang="scss" scoped src="./compName.scss" />
