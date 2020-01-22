import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

window.language = localStorage.getItem('language') || 'en'

// Ugly hack to get i18n to return arrays, no checks done whatsoever
Vue.prototype.$ta = function (key) {
  return this.$i18n._path.getPathValue(this.$i18n._getMessages()[this.$i18n.locale], key)
}

export default new VueI18n({
  locale: window.language,
  missing: (locale, key, vm) => {
    console.warn('MISSING i18n: ' + locale + ' / ' + key)
  },
  silentTranslationWarn: true
})
