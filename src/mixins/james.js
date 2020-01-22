import Vuex from 'vuex'

export default {
  methods: {
    jamesSay (text, type, i18n) {
      this.$store.state.coding.james.say(text, type, i18n)
    },
    ...Vuex.mapMutations({
      'jamesInc': 'jamesIncrement',
      'jamesDec': 'jamesDecrement',
      'jamesReset': 'jamesReset'
    })
  }
}
