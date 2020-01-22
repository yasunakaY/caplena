<template>
  <div class="helptip">
    <span ref="anchor"
          class="anchor"
          @mouseover="active+=1"
          @mouseout="hide"
          :class="{ [position]: true }">
      <span class="anchor-text">{{ anchorText }}</span>
      <i class="mdi mdi-help-circle" :class="{ 'superscript': superscript}" />
    </span>
    <div ref="content"
         @mouseover="active+=1"
         @mouseout="hide"
         class="helptip-content"
         :class="{ dark: dark, [position]: true }"
         :style="{ 'width': width + 'px' }"
         v-show="active">
      <slot/>
      <div class="arrow" ref="arrow"/>
    </div>
  </div>
</template>

<script>
'use strict'

import Popper from 'popper.js'

export default {
  codit: true,
  name: 'Helptip',
  props: {
    anchorText: { type: String, default: '' },
    superscript: { type: Boolean, default: false },
    dark: { type: Boolean, default: true },
    width: { type: Number, default: 300 },
    position: { type: String, default: 'bottom' },
    xOffset: { type: String, default: '0' },
    preventOverflow: { type: Boolean, default: true }
  },

  data () {
    return {
      active: 0,
      popper: null
    }
  },

  watch: {
    active (curr, prev) {
      if (this.popper && !prev && curr) this.popper.update()
    }
  },

  mounted () {
    this.popper = new Popper(this.$refs.anchor, this.$refs.content, {
      placement: this.position,
      modifiers: {
        preventOverflow: { enabled: this.preventOverflow },
        flip: { enabled: false },
        offset: { enabled: true, offset: `${this.xOffset},10px` },
        arrow: { element: this.$refs.arrow },
        hide: { enabled: false }
      }
    })
  },

  methods: {
    hide () {
      this.$_.delay(v => { this.active -= 1 }, 50)
    }
  }
}

</script>

<style lang=scss>

$color-dark: #333;
$color-light: #FFF;

.helptip {
  display: inline-block;
  position: relative;
}

.helptip .mdi {
  margin-left: 1px;
  font-size: larger;
  vertical-align: text-top;
  line-height: 1.1;
  letter-spacing: 0;
}

.helptip .mdi.superscript {
   vertical-align: top;
   font-size:smaller;
}

.helptip .anchor {
  cursor: help;
  .anchor-text {
    padding-bottom: 2px;
    border-bottom: 1px dashed;
  }

  &:before {
    content: '';
    cursor: help;
    position: absolute;
    width: 100%;
    z-index: 10;
  }
}
.helptip .anchor.top::before { top:-15px; bottom:-2px; }
.helptip .anchor.bottom::before { bottom:-16px; top:2px; }

.helptip-content {
  font-size: 14px;
  cursor: default;
  z-index: 100;
  text-align: left;
  background-color: $color-light;
  padding: 20px;
  min-width: 300px;
  border-radius: 5px;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
  border: 1px solid #DDD;
  color: #1E2021;
  line-height: 1.4;
  text-shadow: none;
  animation: fadeIn 0.3s ease-out;
  white-space: normal;

  .arrow {
    position: absolute;
    content: '';
    width:0;
    height: 0;
    border:6px solid transparent;
  }

  &.top .arrow { bottom:-12px; border-top-color:$color-light; }
  &.bottom .arrow { top:-12px; border-bottom-color: $color-light; }
  &.top.dark .arrow { border-top-color: $color-dark; }
  &.bottom.dark .arrow { border-bottom-color: $color-dark; }

  &.dark {
    background-color: $color-dark;
    border: 1px solid #FFF;
    color: #FFF;
  }
}

</style>
