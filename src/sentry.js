/**
 * Vue.js 2.0 plugin
 *
 */

import Vue from 'vue'
const doHash = require('object-hash')
const CircularJSON = require('flatted/esm')
import { store } from './store'
import { getGlobalObject } from '@sentry/utils/misc'
import { getCurrentHub, withScope } from '@sentry/core'
import { isPlainObject, isUndefined } from '@sentry/utils/is'

const MAX_DATA_SIZE = 70 * 1024 // Sentry limit is 100k, so we limit our data to 80k

const jsonSize = (s) => {
  // Don't do this anymore, can cause crash on strange data
  // return ~-encodeURI(s).split(/%..|./).length
  return s.length
}

function getClosestCoditParent (vm) {
  let current = vm
  while (vm.$root !== current && !!current) {
    if (current.$options.codit === true) return current
    current = current.$parent
  }
}

function formatComponentName (vm) {
  if (vm.$root === vm) {
    return 'root instance'
  }
  var name = vm._isVue ? vm.$options.name || vm.$options._componentTag : vm.name
  return (
    (name ? 'component <' + name + '>' : 'anonymous component') +
    (vm._isVue && vm.$options.__file ? ' at ' + vm.$options.__file : '')
  )
}

function sendAdditionalDataAsBugReport (identifier, dataAsStr) {
  api.post('/api/bugreport/', {
    bugtype: 'D',
    error: 'frontend-additional-data',
    context: dataAsStr,
    description: identifier
  }, { dontReport: true }).catch(err => {
    console.error(`Failed to send additional data (id=${identifier})`, err)
  })
  console.info(`Sent additional data to bug-report: ${identifier}`)
}

// Persistent set of hashes of data objects that have already been sent
let additionalDataSent = new Set()

class VueSentry {
  name = 'Vue'
  id = 'Vue'
  Vue = null

  constructor (options = {}) {
    this.Vue = options.Vue || (getGlobalObject()).Vue
  }

  // Plugin for sentry
  setupOnce () {
    if (!this.Vue || !this.Vue.config) return

    var _oldOnError = this.Vue.config.errorHandler
    this.Vue.config.errorHandler = (error, vm, info) => {
      errorHandler(vm, error, info)
      if (typeof _oldOnError === 'function') {
        _oldOnError.call(this.Vue, error, vm, info)
      }
    }
  }
}

function errorHandler (vm, error, info, context) {
  console.error('Processing caught error: ', error)

  let limit = MAX_DATA_SIZE

  // Get a random identifier for referencing the additional data sent
  let additionalDataIdentifier = doHash(new Date().getTime() + navigator.appVersion)
  let additionalDataToSend = {}

  let _cloneIfSmallerThanLimit = (data, key) => {
    // Clone the object if the size is smaller than current limit
    // otherwise return a string indicating that it was too large
    if (data === undefined) return data

    // Check that no child element is a vue instance, that could lead to ugly shit

    data = _.filter(data, (v, k) => {
      if (v instanceof Vue) return false
      if (k === '__ob__') return false
      if (v instanceof Node) return false
    })

    let str = CircularJSON.stringify(data)
    limit -= jsonSize(str)
    if (limit > 0) return JSON.parse(str)
    else {
      // We don't have space in sentry
      // So just store the reference to a BugReport object (if it wasn't sent already)
      const dataHash = doHash(str)
      if (!additionalDataSent.has(dataHash)) {
        additionalDataToSend[key] = str
        additionalDataSent.add(dataHash)
      }
      return `Object too large. Reference: ${additionalDataIdentifier}`
    }
  }

  var metaData = {}
  if (typeof context === 'object') {
    _.each(context, (val, key) => { metaData[key] = _cloneIfSmallerThanLimit(val, key) })
  }

  // vm and lifecycleHook are not always available
  if (isPlainObject(vm)) {
    metaData.componentName = formatComponentName(vm)
    if (vm.$options) metaData.propsData = _cloneIfSmallerThanLimit(vm.$options.propsData, 'propsData')
    metaData.data = _cloneIfSmallerThanLimit(vm.$data, 'data')

    let closestCoditParent = getClosestCoditParent(vm)
    let closestCoditParentName = (closestCoditParent ? `coditParent_${closestCoditParent.$options.name}` : 'coditParent_inexistant')
    if (closestCoditParent) metaData[closestCoditParentName] = _cloneIfSmallerThanLimit(closestCoditParent.$data, closestCoditParentName)

    metaData.store = _cloneIfSmallerThanLimit(store.state, 'store')
  }

  if (!isUndefined(info)) {
    metaData.lifecycleHook = info
  }

  if (_.keys(additionalDataToSend).length) {
    // Generate the data to send
    // As the strings are already encoded json just compose the object manually
    let strEls = []
    _.forEach(additionalDataToSend, (val, key) => strEls.push(`"${key}":${val}`))
    let strToSend = '{' + strEls.join(',') + '}'
    sendAdditionalDataAsBugReport(additionalDataIdentifier, strToSend)
  }

  if (getCurrentHub().getIntegration({ id: 'Vue' })) {
    withScope(scope => {
      Object.keys(metaData).forEach(key => {
        scope.setExtra(key, metaData[key])
      })

      scope.addEventProcessor(async (event) => {
        if (event.sdk) {
          const integrations = event.sdk.integrations || []
          event.sdk = {
            ...event.sdk,
            integrations: [...integrations, 'vue']
          }
        }
        return event
      })

      getCurrentHub().captureException(error, { originalException: error })
    })
  }
}

export { VueSentry, errorHandler }
