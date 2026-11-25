<template>
  <froala id="edit" :tag="'textarea'" :config="config" v-model:value="model"></froala>
</template>

<script>
export default {
  data() {
    return {
      model: '<p>Hi</p>',
      config: {
        key: 'YOUR-KEY',
        toolbarInline: false,
        toolbarButtons: [['bold', 'italic'], ['formatOL', 'formatUL']],
        events: {
          focus() {
            this.selection.save();
          },
        },
      },
    };
  },
};
</script>
