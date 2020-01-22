<template>
  <div class="c-alert" :class="{ [`alert-${type}`]: true }" v-if="!closed">
    <v-icon>{{ ((type in iconLookup) ? iconLookup[type] : '' ) }}</v-icon>
    <div style="margin: auto 0">
      <slot/>
    </div>
    <v-btn icon small v-if="closeable" @click="closed=true" class="delete-btn">
      <v-icon>mdi-close-circle</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  codit: true,
  name: 'Alert',
  props: {
    type: { type: String, default: undefined },
    closeable: { type: Boolean, default: false }
  },

  data () {
    return {
      iconLookup: { success: 'mdi-check-circle', info: 'mdi-information', warning: 'mdi-alert', error: 'mdi-alert-circle' },
      closed: false
    }
  }
}

</script>

<style lang=scss>

.c-alert {
  font-size: 14px;
  border-top: 4px solid rgba(0,0,0,.17);
  margin: 1rem 0;
  color: #FFF;
  padding: 10px 8px;
  display: flex;
  justify-content: flex-end;

  > .v-icon { color: rgba(0,0,0,.3); margin: -1px 15px 0 0 }

  > .v-btn {
    .v-icon {
      border-radius: 100%;
      background: #FFF;
      color: rgba(0, 0, 0, 0.87);
    }
  }

  > div { flex: 1; }

  &.alert-success { background-color: #4CAF50; }
  &.alert-info { background-color: rgba(14, 93, 136, 0.8) }
  &.alert-warning { background-color: #FFC107; }
  &.alert-error { background-color: #FF5252; }
}

</style>
