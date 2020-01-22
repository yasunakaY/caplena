'use strict'

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import Vue from 'vue'
import Vuetify from 'vuetify'
import colors from 'vuetify/es5/util/colors'
import VueAnalytics from 'vue-analytics'
import VueLocalStorage from 'vue-ls'

import router from './router.js'
import { API, WS } from './api.js'
import i18n from './i18n'
import { clickOutsideDirective } from './directives'

import AppPage from './AppPage'
import Helptip from './components/Helptip'
/* import Truncate from './components/Truncate' */
import Loading from './components/Loading'
import Alert from './components/Alert'
import CodeChip from './components/CodeChip'
import AdvancedOptions from './components/AdvancedOptions'
import EmptyState from './components/EmptyState'
import InputFile from './components/InputFile'
import NoPermission from './components/NoPermission'
import colormap from './components/colormap.js'

import * as Sentry from '@sentry/browser'
import { errorHandler, VueSentry } from './sentry'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/dist/vuetify.min.css' // Ensure you are using css-loader

let lodash = require('lodash')
var moment = require('moment')

moment.locale(window.language)

Vue.use(Vuetify)

Vue.use(VueLocalStorage)

window._ = lodash
window.api = API
window.ws = WS
window.moment = moment

if (process.env.CODIT_ENV === 'prod') {
  Vue.use(VueAnalytics, {
    id: process.env.GAID,
    router,
    autoTracking: {
      pageviewTemplate (route) {
        return {
          page: '/app' + route.path,
          title: route.name,
          location: window.location.href
        }
      }
    }
  })
}

Vue.config.devtools = process.env.CODIT_ENV !== 'prod'
// Vue.config.performance = process.env.CODIT_ENV !== 'prod'
Vue.config.productionTip = false

// Vue.component('truncate', Truncate)
Vue.component('loading', Loading)
Vue.component('helptip', Helptip)
Vue.component('alert', Alert)
Vue.component('code-chip', CodeChip)
Vue.component('advanced-options', AdvancedOptions)
Vue.component('empty-state', EmptyState)
Vue.component('input-file', InputFile)
Vue.component('no-permission', NoPermission)

if (process.env.CODIT_ENV !== 'local') {
  Sentry.init({
    dsn: 'https://eeac229948734c33b626171b98eed74a@sentry.caplena.com/2',
    debug: process.env.CODIT_ENV !== 'prod',
    environment: process.env.CODIT_ENV,
    integrations: [new VueSentry({ Vue })],
    // Add innerText to click breadcrumbs
    beforeBreadcrumb (breadcrumb, hint) {
      if (breadcrumb.category === 'ui.click') {
        const { target } = hint.event
        if (target.innerText) {
          breadcrumb.message += ` {${target.innerText.slice(0, 15)}}`
        }
      }
      return breadcrumb
    }
  })
}

Vue.prototype.$moment = moment
Vue.prototype.$Sentry = Sentry
Vue.prototype.$color = colormap
Vue.prototype.$_ = lodash

Vue.prototype.$hasPermission = function (permission, obj) { return this.$root.hasPermission(permission, obj) }
// Manual error handler which can be called by app
Vue.prototype.$onError = function (error, info, context) { errorHandler(this, error, info, context) }

// Wrapper to capitalize first letter of translated text
Vue.prototype.$tu = function (lookup) {
  let str = this.$t(lookup)
  return str.charAt(0).toUpperCase() + str.substr(1)
}
Vue.prototype.$maybeRaiseAPIPromiseErr = function (err) {
  // Function to catch errors of API call promises
  // We only report the error if it hasn't already been reported by the API error handler
  if (!err.response || !err.response.apiErrReported) {
    // setTimeout(() => { throw err }, 0)
    this.$onError(err)
  }
}
Vue.prototype.$maybeTruncate = function (string, maxLen) {
  if (string.length > maxLen) return string.slice(0, maxLen) + '...'
  else return string
}

Vue.prototype.$uuidv4 = function () {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

function parseDateString (val) {
  if (val === 'now') return moment()
  else return moment.utc(val)
}

Vue.filter('datetimeverbose', val => parseDateString(val).local().format('dddd, MMMM Do YYYY, H:mm'))
Vue.filter('datelong', val => parseDateString(val).local().format('D. MMMM YYYY'))
Vue.filter('dateshort', val => parseDateString(val).local().format('DD.MM.YYYY'))
Vue.filter('datemonthyear', val => parseDateString(val).local().format('MMMM YYYY'))
Vue.filter('fromnow', val => parseDateString(val).local().fromNow())
Vue.filter('fromchoice', (idx, choices) => { let c = ''; choices.forEach(v => { if (v[0] === idx) c = v[1] }); return c })
Vue.filter('round', (val, digits, keep) => { let fixed = val.toFixed(digits); return keep ? fixed : +fixed })
Vue.filter('percent', (val, base) => (val === 0 ? 0 : 100 * val / base))
Vue.filter('uppercase', val => (typeof val === 'string' ? val.toUpperCase() : val))
Vue.filter('enumerate', (val, glue) => val.length > 1 ? `${val.slice(0, val.length - 1).join(', ')} ${glue} ${val.slice(-1)}` : val.join(''))

// Don't name it click-outside, this would infere with the vuetify.js click-outside directive
Vue.directive('c-click-outside', clickOutsideDirective)

let AppComponent = Vue.component('app', AppPage)
/* eslint-disable no-new */
const app = new AppComponent({
  el: '#mountpoint',
  vuetify: new Vuetify({
    theme: {
      themes: {
        light: {
          primary: '#0e5d88', // #E53935
          secondary: '#404850', // #FFCDD2
          accent: colors.red.accent2, // #3F51B5
          success: '#4CAF50'
        },
        dark: {
          secondary: '#404850'
        }
      },
      options: {
        customProperties: true
      }
    },
    icons: {
      iconfont: 'mdi'
    }
  }),
  router,
  i18n
})

if (window.Cypress || process.env.CODIT_ENV === 'dev' || process.env.NODE_ENV === 'development') {
  // only available during E2E tests or on dev
  window.app = app
}
