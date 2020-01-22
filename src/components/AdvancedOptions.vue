<template>
  <div>
    <v-divider v-if="dividerTop"/>
    <div style="display: flex; justify-content: center">
      <v-btn small fab style="margin: 4px -5px 0 0" @click="show=!show"><!--  style="margin: 7px -5px 0 0" -->
        <v-icon>{{ (shouldShow ? 'mdi-chevron-up' : 'mdi-chevron-down') }}</v-icon>
      </v-btn>
      <v-subheader>{{ subtitle }}</v-subheader>
    </div>

    <slot v-if="shouldShow"/>
    <v-divider v-if="dividerBottom" style="margin-top: 10px" />
  </div>
</template>

<script>
export default {
  codit: true,
  name: 'AdvancedOptions',
  props: {
    dividerTop: { type: Boolean, default: false },
    dividerBottom: { type: Boolean, default: false },
    text: { type: String, default: undefined },
    forceShow: { type: Boolean, default: false }
  },
  data () {
    return {
      show: false
    }
  },
  computed: {
    subtitle () { return (this.text !== undefined ? this.text : this.$t('subtitle-1')) },
    shouldShow () { return this.forceShow || this.show }
  }
}
</script>

<i18n>
{
  "de": {
    "subtitle-1": "Erweiterte Optionen"
  },
  "en": {
    "subtitle-1": "Advanced options"
  }
}
</i18n>
