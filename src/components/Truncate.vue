<template>
  <span>
    <span v-if="!truncated">{{ truncate(text) }} <a v-if="text.length >= length" @click="toggle()">{{ clamp || 'Read More' }}</a></span>
    <span v-if="truncated">{{ text }} <a @click="toggle()" v-if="text.length >= length">{{ less || 'truncated Less' }}</a></span>
  </span>
</template>

<script>
export default {
  codit: true,
  name: 'Truncate',

  props: { 'text': String, 'clamp': String, 'length': Number, 'less': String },
  methods: {
    truncate (string) {
      if (string) {
        return string.toString().substring(0, this.length || 100)
      }

      return ''
    },
    toggle () {
      this.truncated = !this.truncated
    }
  },

  data () {
    return {
      truncated: false
    }
  }
}
</script>

<style lang="css" scoped>
  a {
    cursor: pointer;
  }
</style>
