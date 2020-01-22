<template>
  <div class="loading-component" :style="{ 'min-height': minHeight, 'display': flex ? 'flex' : 'block', flex: flex ? '1' : '' }">
    <transition :name="transitionValue" mode="out-in">
      <div class="loading-container" key="loading" v-if="isLoading">
        <div><v-progress-circular :size="100" :width="10" :value="value" :indeterminate="value === null" color="primary" /></div>
        <span class="headline">{{ title }}</span><br >
        <span class="subtitle-1">{{ tagline }}</span>
      </div>
      <div key="notLoading" class="not-animated" v-else :style="{ 'display': flex ? 'flex' : 'block' }"><slot/></div>
    </transition>
  </div>
</template>

<script>
export default {
  codit: true,
  name: 'Loading',
  props: {
    // If value is null, indeterminate loading is activated, otherwise progress is shown
    value: { type: [Object, Number], default: null },
    title: { type: String, default: 'Hold tight, we\'re crunching that data.' },
    tagline: { type: String, default: '(might take a few seconds)' },
    isLoading: { type: Boolean, default: false },
    dontAnimateEntry: { type: Boolean, default: false },
    dontAnimateLeave: { type: Boolean, default: false },
    transition: { type: String, default: 'slide-left' },
    minHeight: { type: String, default: '' },
    flex: { type: Boolean, default: false }
  },
  data () {
    return { }
  },
  computed: {
    transitionValue () {
      if (this.dontAnimateEntry && this.isLoading) return ''
      if (this.dontAnimateLeave && !this.isLoading) return ''
      return this.transition
    }
  }
}

</script>

<style lang=scss>

@import '~@/css/animations.css';

.loading-component {
  display: flex;
  width: 100%;

  .not-animated {
    flex: 1;
    transition: none;
    width: 100%;
  }

  .loading-container {
    text-align: center;
    flex: 1;
    align-self: center;

    .v-progress-circular {
      margin: 20px 0;
    }
  }
}

</style>
