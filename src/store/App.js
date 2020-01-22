import Vue from 'vue'

export default {
  strict: false, // process.env.NODE_ENV !== 'production',
  state: {
    translateLanguages: {},
    pageTitle: '',
    breadcrumbProps: {},
    tourFn: null,
    errorStatus: 0,
    user: {
      id: -1,
      isAnonymous: false,
      first_name: '',
      email: '',
      profile: { pages_visited: [], language: '', credits_remaining_monthly: 0, credits_remaining_oneoff: 0 },
      subscription: {
        starts: '',
        ends: '',
        plan: {
          id: -1,
          name: '',
          recurring: false,
          credits_monthly: 0,
          credits_oneoff: 0,
          price_monthly: 0,
          price_oneoff: 0
        }
      }
    }
  },

  mutations: {
    setTranslateLanguages: (state, languages) => {
      Vue.set(state, 'translateLanguages', languages)
    },

    setPageTitle: (state, pageTitle) => {
      state.pageTitle = pageTitle
    },

    setBreadcrumbProps: (state, props) => {
      Vue.set(state, 'breadcrumbProps', props)
    },

    setTourFn: (state, tourFn) => {
      state.tourFn = tourFn
    },

    setUser: (state, user) => {
      // Set the user, but never revert the isAnonymous flag
      Vue.set(state, 'user', { ...user, isAnonymous: state.user.isAnonymous })
    },

    userIsAnonymous: (state) => {
      Vue.set(state.user, 'isAnonymous', true)
    },

    setUserProperty: (state, { key, value, path }) => {
      path = _.get(state.user, path) || state.user
      Vue.set(path, key, value)
    },

    setErrorStatus: (state, status) => {
      state.errorStatus = status
    }
  },

  getters: {
    userCreditsRemaining: state => state.user.profile.credits_remaining_monthly + state.user.profile.credits_remaining_oneoff
  },

  actions: {
    /** =========== SURVEY actions =========== **/
    updateUser ({ commit, state, getters, dispatch }, properties) {
      // Commit the changes to state
      let dontPatch = ('dontPatch' in properties) && properties.dontPatch
      if (dontPatch) delete properties['dontPatch']
      _.forOwn(properties, (value, key) => {
        if (key === 'profile') _.forOwn(value, (subVal, subKey) => commit('setUserProperty', { path: 'profile', key: subKey, value: subVal }))
        else commit('setUserProperty', { key, value })
      })
      if (!dontPatch) return api.patch('/api/auth/user/', properties, { dontReport: [400] })
      else return true
    }
  }
}
