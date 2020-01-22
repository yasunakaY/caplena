<template>
  <v-list-item class="control-tile" :class="classes">
    <v-list-item-content>
      <slot />
    </v-list-item-content>

    <v-list-item-action v-if="$slots.actions">
      <slot name="actions" />
    </v-list-item-action>

  </v-list-item>
</template>

<script>

export default {
  codit: true,
  name: 'ControlTile',

  data () {
    return {
      classes: { highlight: false }
    }
  },

  methods: {
    highlight () {
      this.classes.highlight = true
      setTimeout(() => { this.classes.highlight = false }, 4150)
    }
  }
}

</script>
