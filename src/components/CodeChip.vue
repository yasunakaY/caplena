<template>
  <div class="code-chip" tabindex="0" :class="chipClasses">
    <v-tooltip top :disabled="!tooltipEnabled">
      <template v-slot:activator="{ on }">
        <div v-on="on">
          <template v-if="onlyAvatar">
            <span class="avatar" :style="{ background: color }"> {{ avatarChar.toUpperCase() }}</span>
          </template>

          <template v-else-if="avatarChar">
            <span class="avatar" :style="{ background: color }"> {{ avatarChar.toUpperCase() }}</span>
            <slot />
          </template>

          <template v-else-if="category">
            <span ref="category" class="category" :style="{ background: color }"> {{ category.toUpperCase() }}</span>
            <span ref="content"><slot /></span>
          </template>

          <v-btn icon v-if="deletable" @click.stop.prevent="$emit('delete', $event)" class="delete-btn" small>
            <v-icon size="21">mdi-close-circle</v-icon>
          </v-btn>

        </div>
      </template>
      <template><template v-if="category">{{ category }}: </template><slot /></template>
    </v-tooltip>
  </div>
</template>

<script>
export default {
  codit: true,
  name: 'CodeChip',
  props: {
    color: {
      type: String,
      default: ''
    },

    avatarChar: {
      type: String,
      default: ''
    },

    category: {
      type: String,
      default: ''
    },

    avatarLabel: {
      type: String,
      default: ''
    },

    active: {
      type: Boolean,
      default: false
    },

    deletable: {
      type: Boolean,
      default: false
    },

    onlyAvatar: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      hasOverflow: false
    }
  },

  computed: {
    chipClasses () {
      return {
        'deletable': this.deletable,
        'active': this.active,
        'only-avatar': this.onlyAvatar,
        'has-content': !this.onlyAvatar,
        'has-avatar': this.avatarChar !== '',
        'has-category': this.category !== ''
      }
    },

    tooltipEnabled () { return this.onlyAvatar || (this.category && this.hasOverflow) }
  },

  mounted () {
    if (this.category) this.checkIfOverflow()
  },

  updated () {
    if (this.category) this.checkIfOverflow()
  },

  methods: {
    /**
     * Check if we have a text overflow situation, leading to the display of a tooltip
     */
    checkIfOverflow () {
      let cat = this.$refs.category
      let con = this.$refs.content

      if ((cat && cat.scrollWidth > cat.clientWidth) || (con && con.scrollWidth > con.clientWidth)) this.hasOverflow = true
    }
  }
}

</script>

<style lang=scss>

$code-chip-height: 36px;

.code-chip {
  margin: 2px 2px;
  padding: 0 12px;
  background: #FFF;
  color: #888;
  position: relative;
  height: $code-chip-height;
  display: inline-block;
  cursor: default;
  transition-property: background-color, color, opacity, transform, box-shadow;
  will-change: background-color, color, opacity, transform, box-shadow;
  transition-duration: .3s;
  font-size: 13px;
  vertical-align: middle;
  white-space: nowrap;

  &.has-content {
    min-width: 90px;
  }

  &.has-avatar {
    padding-left: 44px;
    border-radius: $code-chip-height;
    line-height: $code-chip-height;
  }

  &.has-category {
    border-radius: $code-chip-height / 4;
    padding-top: $code-chip-height / 2;
    line-height: $code-chip-height / 2;
  }

  /* color: rgba(0, 0, 0, .54); */
  .avatar {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 50%;
    display: inline-block;
    width: $code-chip-height;
    height: $code-chip-height;
    line-height: $code-chip-height;
    text-align: center;
    vertical-align: center;
  }

  .category {
    position: absolute;
    height: $code-chip-height / 2;
    top: 0;
    left: 0;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    font-size: smaller;
    font-variant: small-caps;
    font-weight: 450;
    line-height: $code-chip-height / 2;
    padding: 1px 12px;
    text-overflow: ellipsis;
    border-radius: $code-chip-height / 4 $code-chip-height / 4 0 0;
    color: #FFF
  }

  &.only-avatar .avatar { color: #FFF; }

  &:focus {
    outline: none;
  }

  &.active {
    cursor: pointer;
    color: inherit;
  }

  &.deletable {
    padding-right: 30px;
    .category { padding-right: 30px }
  }

  .v-btn {
    width: 26px;
    min-width: 26px;
    height: 26px;
    margin: 0;
    position: absolute;
    top: 50%;
    right: 1px;
    z-index: 11;
    transform: translate3D(0, -50%, 0);
    transition-duration: .3s;
    font-size: 26px;

    .v-icon {
      color: #AAA;
      border-radius: 100%;
      background: #FFF;
    }
  }

  &.has-category .v-btn {
    top: 50%;
  }

  &.selected {
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
  }

  &.selected, &.active:hover {
    background-color: #BDBDBD;
    .v-icon {
      background: #BDBDBD;
      color: #EEE;
    }

    .v-icon:hover {
      background: #666;
    }
  }

  &.only-avatar { padding: 0 $code-chip-height / 2; }

  .delete-btn .v-icon {
    width: 20px;
    height: 20px;
  }
}

</style>
