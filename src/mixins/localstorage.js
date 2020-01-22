/***/
/* Mixin to handle local storage settings
/***/

export default {
  methods: {
    // Get global settings
    getLsGlobalSettings () {
      return this.$ls.get('codit-global-settings', {})
    },

    // Set global settings
    setLsGlobalSettings (globalSettings) {
      this.$ls.set('codit-global-settings', _.merge(this.getLsGlobalSettings(), globalSettings))
      return this.getLsGlobalSettings()
    },

    // Get question specific settings
    getLsQuestionSettings () {
      return this.$ls.get('codit-survey-settings', {})[this.question.id] || {}
    },

    // Set question specific settings
    setLsQuestionSettings (questionSettings) {
      let settingsState = this.$ls.get('codit-survey-settings', {})
      // Merge with previous settings, new ones have priority
      settingsState[this.question.id] = _.merge(settingsState[this.question.id], questionSettings)

      this.$ls.set('codit-survey-settings', settingsState)
      return settingsState[this.question.id]
    }
  }
}
