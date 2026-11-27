<template>
  <froala :tag="'textarea'" :config="{ placeholderText: 'Hi', toolbarSticky: true, colorsDefaultTab: 'text' }" v-model:value="model"></froala>
</template>

<script setup>
import { ref } from 'vue';
const model = ref('');
</script>
