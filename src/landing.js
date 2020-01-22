// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import LandingPage from './LandingPage'
import { API } from './api.js'
import Lodash from 'lodash'
import i18n from './i18n'
import VueAnalytics from 'vue-analytics'
import colormap from './components/colormap.js'
import PseudoTooltip from './components/PseudoTooltip'

if (process.env.CODIT_ENV === 'prod') {
  Vue.use(VueAnalytics, {
    id: process.env.GAID
  })
}

// Set language according to url
let lang = 'en'
if (window.location.pathname.startsWith('/en')) lang = 'en'
if (window.location.pathname.startsWith('/de')) lang = 'de'
window.language = lang
i18n.locale = window.language

Vue.config.productionTip = false
Vue.prototype.$api = API
Vue.prototype.$_ = Lodash
Vue.prototype.$color = colormap
Vue.component('v-tooltip', PseudoTooltip)

let LandingComponent = Vue.component('landing', LandingPage)
/* eslint-disable no-new */
new LandingComponent({
  el: '#mountpoint',
  i18n
})
/*
document.addEventListener('DOMContentLoaded', function () {
  LandingComponent.$mount('#mountpoint')
}) */
