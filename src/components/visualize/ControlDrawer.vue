<template>
  <v-list-group v-model="expanded" :prepend-icon="icon" no-action subheader class="control-drawer">
    <template v-slot:activator>
      <v-list-item-content>
        <v-list-item-title v-html="title" />
        <v-list-item-subtitle v-html="subtitle" />
      </v-list-item-content>
    </template>

    <slot name="header" />

    <slot>
      <control-tile class="no-items">
        {{ noItemsPlaceholder }}
      </control-tile>
    </slot>

    <slot name="footer" />

  </v-list-group>
</template>

<script>

import ControlTile from '@/components/visualize/ControlTile'

export default {
  codit: true,
  name: 'ControlDrawer',

  components: {
    'control-tile': ControlTile
  },

  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    noItemsPlaceholder: { type: String, default: 'No control elements to show' }
  },

  data () {
    return {
      expanded: false,
      noItems: false
    }
  },

  methods: {
    expand () { this.expanded = true },
    collapse () { this.expanded = false }
  }
}

</script>

<style lang=scss>

.control-drawer {
  .control-tile {
    &:not(.no-bg):hover {
      background: linear-gradient(90deg, transparent 64px, $col-ans-focus-bg 24px);
    }

    &.overheight .v-list-item {
      height: auto;
      min-height: 48px;
    }

    &.highlight {
      animation: highlight-ani 4s;
    }

    .v-list-item__content {
      display: flex;
      flex-direction: row;

      overflow: visible;

      flex-wrap: nowrap;
      align-items: center;
      justify-content: flex-start;
      font-size: 14px;
      max-width: 100%;

      padding: 0;

      position: relative;

      .v-input {
        max-width: calc(100% - 68px);
      }

      .v-input.v-select {
        /* position: relative; */
        .v-input__control {
          /* max-width: 75%; */
        }
      }

      .v-input, label, .v-label {
        margin: 0;
        font-size: 14px;
      }

      .v-input--radio-group__input {
        > .v-label { flex: 0 0 100%; }
        .v-radio .v-label { font-style: italic }
      }

      .v-input:not(.v-input--switch) {
        margin-top: -5px;
        margin-right: 1em;
        flex: 2 1 auto;
      }

      .v-input--switch {
        flex: 0 0 auto;
        margin-right: 1em;
        margin-top: -6px;
        .v-input--selection-controls__input { margin-right: 5px }
      }

      .v-slider__thumb-label {
        font-size: 10px;
      }

      .v-select__selections {
        flex: 1 1 auto;
      }

      .v-select__selection {
        margin: 0;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;
      }

      .code-select {
        margin-right: 1em;
        &, input, input::placeholder {
          padding: 0;
          font-size: 14px;
        }

        .code-chip:not(:hover):not(.selected) {
          background: $col-ans-bg;
        }
      }

      label {
        color: rgba(0,0,0,.54);
      }

      .dimensions {
        flex: 1 1 80px!important;
      }
    }

    .v-list-item__action {
      flex: 0 0 auto;
      flex-direction: row;
      padding: 0;
      margin: 0 -8px 0 0;
      align-items: center;
      .v-btn {
        margin-left: 0;
      }
      .v-icon {
        color: rgba(0,0,0,.54);
      }
    }
  }

  .no-items .v-list-item__content {
    justify-content: center;
    font-style: italic;
  }
}

</style>
