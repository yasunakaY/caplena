<template>
  <div class="empty-state" :class="[emptyStateClasses]" :style="emptyStateStyles">
    <div class="empty-state-container">
      <template v-if="icon">
        <v-icon class="empty-state-icon" :size="size">{{ icon }}</v-icon>
      </template>
      <strong class="empty-state-label" v-if="label" v-html="label" />
      <p class="empty-state-description" v-if="description" v-html="description" />
      <slot />
    </div>
  </div>
</template>

<script>

export default {
  codit: true,
  name: 'EmptyState',
  props: {
    rounded: { type: Boolean, default: false },
    size: { type: Number, default: 160 },
    icon: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: '' }
  },
  computed: {
    emptyStateClasses () {
      return {
        'rounded': this.rounded
      }
    },
    emptyStateStyles () {
      if (this.rounded) {
        const size = this.size + 'px'

        return {
          width: size,
          height: size
        }
      }
    }
  }
}

</script>

<style lang="scss">

  @keyframes scaleAndFadeAnimation {
    0% {
      opacity: 0;
      transform: scale(.7);
    }
    80% {
      transform: scale(1.05);
    }
    100% {
      opacity: 1;
      transform: scale(1.0);
    }
  }

  @mixin empty-state-base () {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .empty-state {
    @include empty-state-base;
    max-width: 420px;
    padding: 36px;
    margin: 0 auto;
    position: relative;
    cursor: default;
    animation: 0.25s scaleAndFadeAnimation ease-out ;

    &.rounded {
      max-width: auto;
      border-radius: 50%;

      .empty-state-container {
        padding: 40px;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }
    }

    .button {
      margin: .5em 0 0;
    }
  }

  .empty-state-container {
    @include empty-state-base;
  }

  .empty-state-label {
    font-size: 26px;
    font-weight: 500;
    line-height: 40px;
  }

  .empty-state-description {
    margin: 1em 0;
    font-size: 16px;
    line-height: 24px;
  }

</style>
