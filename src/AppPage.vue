<template>
  <v-app>
    <v-navigation-drawer app v-model="menuVisible" temporary width="300" v-if="!user.isAnonymous">
      <div style="display: flex; width: 100%; align-items: center">
        <img style="margin: 0 auto" src="./assets/logo.svg" alt="Logo caplena.com" width="150" >
      </div>

      <v-list nav dense class="main-nav">
        <!-- HOME -->
        <v-list-item exact :to="{ name: 'home' }">
          <v-list-item-content>
            <v-list-item-title>{{ $t('menu.home') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider />

        <!-- PROJECTS -->
        <v-list-group prepend-icon="mdi-clipboard-text" no-action :value="routeName.startsWith('project')">
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.projects_group') }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <!-- Projects Manage -->
          <v-list-item exact :to="{ name: 'projects-manage' }">
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.manage') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <!-- Upload -->
          <v-list-item exact :to="{ name: 'upload' }">
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.upload') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <v-divider />

        <!-- CHARTS -->
        <v-list-group prepend-icon="mdi-chart-bar" no-action :value="routeName.startsWith('chart')">
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.charts_group') }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <!-- Charts Manage -->
          <v-list-item exact :to="{ name: 'charts-manage' }">
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.manage') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <!-- Charts Manage -->
          <v-list-item exact :to="{ name: 'chart-details', params: { id: 'new' } }">
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.new') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- DASHBOARDS -->
        <v-list-group prepend-icon="mdi-monitor-dashboard" no-action :value="routeName.startsWith('dashboard')">
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.dashboards_group') }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <!-- Charts Manage -->
          <v-list-item exact :to="{ name: 'dashboards-manage' }">
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.manage') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <!-- Charts Manage -->
          <v-list-item exact :to="{ name: 'dashboard-details', params: { id: 'new' } }">
            <v-list-item-content>
              <v-list-item-title>{{ $t('menu.new') }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
        <v-divider />

        <!-- Account -->
        <v-list-item exact :to="{ name: 'account' }">
          <v-list-item-action>
            <v-icon>mdi-account-box</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('menu.profile') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Logout -->
        <v-list-item @click="logout">
          <v-list-item-action>
            <v-icon>mdi-exit-to-app</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ $t('menu.logout') }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app dense dark v-if="!user.isAnonymous">
      <!-- <v-toolbar-side-icon @click.stop="menuVisible = !menuVisible" /> -->
      <v-app-bar-nav-icon id="mainMenuTrigger" @click="menuVisible = !menuVisible" />

      <!-- <v-toolbar-title style="font-weight: normal">{{ pageTitle }}</v-toolbar-title> -->
      <v-breadcrumbs :items="breadcrumbs" dark />

      <v-spacer />
      <div id="headwayContainer"/>

      <v-menu max-width="250px">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" icon id="buttonHelp" small style="width: 40px; height: 40px">
            <v-icon small>mdi-help</v-icon>
          </v-btn>
        </template>

        <div id="helpMenu">
          <div class="title" style="margin-bottom: 10px">{{ $t('help.title') }}</div>
          <p v-if="tourFn!==null">
            <i18n path="help.description" tag="label" for="help.link" style="white-space: normal">
              <a href="#" @click.prevent="tourFn()">{{ $t('help.link') }}</a>
            </i18n>
          </p>
          <p v-else>{{ $t('help.notour') }}</p>

          <div style="display: flex">
            <v-btn @click="openChat()">{{ $t('help.sendmessage') }}</v-btn>
          </div>

          <a href="mailto:support@caplena.com" style="display: block; text-align: center; margin-top: 8px; margin-bottom: -7px; font-size: smaller">support@caplena.com</a>
        </div>
      </v-menu>

      <v-menu ref="i18nMenu">
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" small style="width: 40px; height: 40px">
            <v-icon small>mdi-web</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item :class="{ 'v-list-item--active' : $i18n.locale === 'de' }"
                       @click="$root.$i18n.locale='de'"
                       color="primary">
            Deutsch
          </v-list-item>
          <v-list-item :class="{ 'v-list-item--active' : $i18n.locale === 'en' }"
                       @click="$root.$i18n.locale='en'"
                       color="primary">
            English
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu content-class="allow-overflow" style="margin-left: 15px;">
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" outlined>
            {{ user.first_name }}
          </v-btn>
        </template>

        <div>
          <v-list>
            <v-list-item exact :to="{ name: 'subscription' }">
              <v-list-item-content>
                <v-list-item-title>{{ $t('menu.profile') }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-account-box</v-icon>
              </v-list-item-action>
            </v-list-item>

            <!-- Logout -->
            <v-list-item @click="logout">
              <v-list-item-content>
                <v-list-item-title>{{ $t('menu.logout') }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-exit-to-app</v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list>

          <v-divider />

          <div class="credits-left">
            {{ $t('credits_remaining', { credits: userCreditsRemaining }) }}
            <helptip x-offset="-120px" :prevent-overflow="false">{{ $t('helptip_credit_acctmenu') }}</helptip>
          </div>
        </div>
      </v-menu>

    </v-app-bar>

    <v-content class="content-container">
      <v-container fluid style="height: 100%">
        <access-denied v-if="errorStatus === 403" />
        <page-not-found v-else-if="errorStatus === 404" />
        <router-view v-else />
      </v-container>
    </v-content>

    <v-dialog v-model="privacyPolicyAcceptance.show" width="800" persistent>
      <v-card>
        <v-card-title class="headline grey lighten-2" primary-title>
          {{ $t('privacy_policy.change_acceptance.title' ) }}
        </v-card-title>

        <v-card-text>
          <p class="subtitle-1"
             v-html="$t('privacy_policy.change_acceptance.intro', { href: `https://caplena.com/${$i18n.locale}/?privacy-policy` })" />

          <p v-html="privacyPolicyAcceptance.summary_changes"/>
        </v-card-text>

        <v-divider/>

        <v-card-actions>
          <v-spacer/>
          <v-btn color="primary" @click="acceptPrivacyPolicy">
            {{ $t('privacy_policy.change_acceptance.accept' ) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar bottom v-model="snackbarOpen" :timeout="snackbarDuration">
      {{ snackbarMsg }}
      <v-btn color="accent" @click="snackbarOpen=false">{{ $t('close') }}</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
import Vuex from 'vuex'

import { store } from './store'
import { overrideSettings } from './settings/coding.js'

import PageNotFound from '@/pages/PageNotFound'
import AccessDenied from '@/pages/AccessDenied.vue'

import DriftMixin from '@/mixins/drift.js'
import LogRocket from 'logrocket'

export default {
  codit: true,
  name: 'App',
  components: {
    'access-denied': AccessDenied,
    'page-not-found': PageNotFound
  },
  mixins: [DriftMixin],
  data () {
    return {
      openChat: null,
      toolbar: true,
      theme: 'default',
      snackbarMsg: '',
      snackbarOpen: false,
      snackbarDuration: 6000,
      userReady: false,
      menuVisible: false,
      nonUserMode: false,

      privacyPolicyAcceptance: {
        show: false,
        summary_changes: ''
      }
    }
  },
  store,
  computed: {
    routeName () {
      return this.$route.name || ''
    },

    routesByName () {
      let mapping = {}
      this.$router.options.routes.forEach(r => {
        mapping[r.name] = r
      })
      return mapping
    },

    breadcrumbs () {
      if (!this.$route.name) return []
      // Get the list of route names that are breadcrumbs to the current page
      let breadcrumbNames = this.$route.meta.breadcrumbs || []
      // Always add home and current route to the breadcrumbs
      let breadcrumbs = ['home', ...breadcrumbNames]
      if (this.$route.name !== 'home') breadcrumbs.push(this.$route.name)

      return _.map(breadcrumbs, bc => {
        // Create breadcrumb, with all relevant entries
        let bcMeta = this.routesByName[bc].meta
        let params = bcMeta.breadcrumbParams ? bcMeta.breadcrumbParams.bind(this)(this.$store.state.breadcrumbProps) : {}
        let query = bcMeta.breadcrumbQuery ? bcMeta.breadcrumbQuery.bind(this)(this.$store.state.breadcrumbProps) : {}
        return {
          text: this.$maybeTruncate(bcMeta.breadcrumbName.bind(this)(this.$store.state.breadcrumbProps) || '', 20),
          // If params returned false explicitely, then the link is not valid
          to: params === false ? undefined : { name: bc, params, query },
          exact: true
        }
      })
    },
    ...Vuex.mapState(['pageTitle', 'tourFn', 'user', 'errorStatus']),
    ...Vuex.mapGetters(['userCreditsRemaining'])
  },
  watch: {
    '$i18n.locale' (val) {
      window.localStorage.setItem('language', val)
      window.language = val
      this.$moment.locale(val)
      moment.locale(val)
      if (val !== this.user.profile.language) {
        this.$store.dispatch('updateUser', { profile: { language: val } }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
      }
    }
  },

  created () {
    // Detect if being run in some testing mode
    if (window.Cypress !== undefined) this.nonUserMode = true

    this.initUser()

    // Load language options
    api.get('/api/translate-languages/').then(res => {
      this.$store.commit('setTranslateLanguages', res.data.iso_languages)
    }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
    this.$router.beforeEach(this.beforePageChange)
  },
  methods: {
    initUser () {
      let deleteCSRFandLogout = () => {
        if (this.$route.meta.allowAnonymous) return
        console.error('Deleting CSRF cookie and logging out.')
        this.clearCookie('csrftoken')
        this.logout(true)
      }

      // Check if the csrftoken is valid, otherwise delete cookie and logout
      api.post('/api/csrftest/', {}, { dontReport: [401, 403] }).then(res => {
        if (res.data !== 'ok') deleteCSRFandLogout()
      }).catch(err => {
        if (!err.response || err.response.status === 401 || err.response.status === 403) {
          console.error('CSRF test failed.')
          deleteCSRFandLogout()
          return
        }
        this.$maybeRaiseAPIPromiseErr(err)
      })

      // Get the login information of the user
      api.get('/api/auth/user/', { dontReport: [401, 403] }).then(res => {
        this.$store.commit('setUser', res.data)
        this.$i18n.locale = res.data.profile.language
        _.forEach(res.data.profile.app_settings, (val, key) => overrideSettings(key, val))
        this.userReady = true

        if (res.data.privacy_policy_new) {
          this.privacyPolicyAcceptance.show = true
          this.privacyPolicyAcceptance.summary_changes = res.data.privacy_policy_new[`summary_changes_${this.$i18n.locale}`]
        }
        // Failing to load one of these services shouldn't lead to forwarding to homepage
        this.initSentry()
        this.initDrift()
        this.initLogrocket()
        this.initHeadway()
      }).catch(err => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.error('Access denied during GET user.')
          if (this.$route.meta.allowAnonymous) this.$store.commit('userIsAnonymous')
          else window.location = '/?session_invalid'
          return
        // If there hasn't been a proper status, something's wrong
        } else this.$onError(err)
      })
    },

    initDrift () {
      if (this.nonUserMode) return
      // Don't run it locally
      if (process.env.CODIT_ENV === 'local') return

      // First load the script from def
      this.loadDriftScript()
      this.drift.on('ready', api => {
        this.openChat = api.sidebar.open

        // Do some configs
        this.drift.config({
          locale: this.$i18n.locale,
          enableWelcomeMessage: false,
          messages: {
            welcomeMessage: this.$t('chat.welcome_online', { name: this.user.first_name }),
            awayMessage: this.$t('chat.welcome_offline', { name: this.user.first_name }),
            thankYouMessage: this.$t('chat.follow_up')
          }
        })

        // Identify the logged in user
        this.drift.identify(this.user.id, {
          email: this.user.email,
          name: this.user.first_name
        })
      })

      // Actually initiate the API, by calling drift with the api key
      this.loadDriftAPI()
    },

    acceptPrivacyPolicy () {
      this.privacyPolicyAcceptance.show = false
      api.post('/api/privacy-policy-accept-now/', {}).then(res => {
        this.$store.dispatch('updateUser', { profile: { privacy_policy_accepted: res.data.accepted }, dontPatch: true })
      }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
    },

    initLogrocket () {
      if (this.nonUserMode) return
      if (this.user.profile.user_settings.opt_out_tracking) return
      const logrocketEnvIdentifiers = { dev: 'ezamhm/codit-dev', prod: 'ezamhm/codit-prod' }
      if (process.env.CODIT_ENV in logrocketEnvIdentifiers) {
        LogRocket.init(logrocketEnvIdentifiers[process.env.CODIT_ENV], {
          network: {
            requestSanitizer: request => {
              // scrub out request body
              request.body = null
              return request
            },
            responseSanitizer: response => {
              // scrub out response body
              response.body = null
              return response
            }
          }
        })
        LogRocket.identify(this.user.id, { id: this.user.id })
      }
    },

    initHeadway () {
      if (this.nonUserMode) return
      let script = document.createElement('script')
      let headwayConfig = {
        selector: '#headwayContainer',
        account: '720Aoy',
        enabled: true
      }
      script.async = true
      script.src = '//cdn.headwayapp.co/widget.js'
      script.onload = v => { window.Headway.init(headwayConfig) }
      document.body.appendChild(script)
    },

    initSentry () {
      this.$Sentry.configureScope((scope) => {
        scope.setUser({
          id: this.user.id,
          email: this.user.email
        })
      })
    },

    clearCookie (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;`
    },

    snackMsg (msg) {
      this.snackbarMsg = msg
      this.snackbarOpen = true
    },

    on403 () {
      // Access denied -> We init the user again, if this failed the user is redirected to the home page
      this.initUser()
      // Otherwise we display the access denied page
      this.$store.commit('setErrorStatus', 403)
    },

    on404 () {
      this.$store.commit('setErrorStatus', 404)
    },

    logout (sessionInvalid = false) {
      // Clear the drift session cookies explicitely
      ['driftt_aid', 'driftt_eid', 'driftt_sid', 'driftt_aaid'].forEach(c => this.clearCookie(c))
      api.get('/api/auth/logout/').then(res => {
        if (res.status === 200) window.location = '/' + (sessionInvalid === true ? '?session_invalid' : '')
        else this.snackMsg(this.$t('menu.logout_error'))
      }).catch(err => this.$maybeRaiseAPIPromiseErr(err))
    },
    markPageAsVisited (page) {
      let profile = { pages_visited: _.clone(this.user.profile.pages_visited) }
      profile.pages_visited.push(page)
      this.$store.dispatch('updateUser', { profile })
    },
    beforePageChange (to, from, next) {
      this.$store.commit('setPageTitle', '')
      this.$store.commit('setTourFn', null)
      this.$store.commit('setBreadcrumbProps', {})
      next()
    },

    hasPermission (permission, obj) {
      if (this.user.profile.organization === null) return true
      if (this.user.view_permissions && this.user.view_permissions[permission]) return true
      if (this.user.profile.organization.root_user_id === this.user.id) return true
      if (obj !== undefined && obj.owner_id === this.user.id) return true
      if (obj !== undefined && 'permissions' in obj && obj.permissions[permission]) return true
      return false
    }
  }
}
</script>

<style scoped lang=scss>

@import '~@/css/animations.css';

#helpMenu {
  padding: 12px 16px;
}

</style>

<style lang=scss>

.theme--light.v-card {
  &, .v-card__text { color: rgba(0,0,0,.87) }
}

.theme--dark.v-sheet {
  background-color: var(--v-secondary-base)!important;
  border-color: var(--v-secondary-base)!important;
}

.v-app-bar .v-breadcrumbs {
  a {
    margin-bottom: -2px;
    color: #FFF;
    border-bottom: 1px dashed #FFF;
  }
  a.v-breadcrumbs__item--disabled {
    color: #CCC;
    text-decoration: none;
    border-bottom-color: transparent;
  }
}

.main-nav {
  .v-list-item__title { font-size: 14px!important }
}

/* @import '~cssvars'; */

.main-content {
  margin: 16px 8px;
}

#drift-widget-container { z-index: 10000 !important;}

.hopscotch-content {
  line-height: 1.5!important;
}

a:hover { text-decoration-color: inherit }
a, .v-list a, .code-select a, .label-select a {
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.15s ease-in-out;
}

.v-menu__content.allow-overflow {
  overflow: visible;
  contain: none;
}

.v-dialog.allow-overflow {
  overflow: visible;
}

.v-data-table td {
  font-size: 13px;
}

html {
  min-width: 1024px;
  overflow: scroll;
}

.v-menu__content { background: #FFF }

.credits-left {
  font-size: 14px;
  padding: 4px 16px;
  white-space: normal;
  color: #0e5d88;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 3px;
}

ul { list-style-type: square; }

.highlight-text {
  &:not(.hljs) {
    background: rgba(255, 229, 127, 0.2)!important;
    color: #ff8f00!important;
    margin-left: 1px;
    margin-right: 1px;
    padding: 0 4px;
    display: inline-block;
    border-radius: 2px;
    font-family: "Operator Mono", "Fira Code", Menlo, Hack, "Roboto Mono", "Liberation Mono", Monaco, monospace;

    pre {
      margin: 8px 0;
    }
  }
}

#headwayContainer { width: 32px; height: 32px }
#HW_badge { background-color: #ff5252!important }
#HW_badge.HW_softHidden { background: #FFF!important; }

.beta-burst {
    background: #ff5252;
    width: 35px;
    height: 35px;
    position: absolute;
    text-align: center;
    display: inline;
    margin-left: 35px;
    margin-top: -8px;
    cursor: default;
    span {
      position: absolute;
      z-index: 20;
      left: 3px;
      top: 7px;
      color: #FFF;
    }
}
.beta-burst:before, .beta-burst:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 35px;
    width: 35px;
    background: #ff5252;
}
.beta-burst:before {
    transform: rotate(30deg);
}
.beta-burst:after {
    transform: rotate(60deg);
}

/* Fix vuetify issue https://github.com/vuetifyjs/vuetify/issues/4473 */
.v-input.v-text-field .v-label:not(.v-label--active) {
    cursor: text;
}

.label {
  border-radius: 3px;
  margin: 0 2px;
  padding: 2px 4px;
  font-family: Roboto,Noto Sans,-apple-system,BlinkMacSystemFont,sans-serif;
  color: #FFF;
  font-size: 12px;
  font-weight: 500;
  background: #999;
  line-height: 19px;
}

.c-alert.retry {
  display: flex;
  > div { display: flex }
  .text { margin: auto 0; flex: 1; }
  .v-btn { flex: 0 0 auto }
}

</style>
<i18n src='./i18n/AppPage.json'></i18n>
