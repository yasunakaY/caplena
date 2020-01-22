import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import appStore from './App'
import coding from './Coding'

export const store = new Vuex.Store(appStore)
export const DynamicModules = {
  coding
}
